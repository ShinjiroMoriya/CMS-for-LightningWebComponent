import { LightningElement, wire, api } from "lwc";
import { createRecord, updateRecord, deleteRecord } from "lightning/uiRecordApi";
import getCategories from "@salesforce/apex/CategoryController.getCategories";
import getArticleCategories from "@salesforce/apex/CategoryController.getArticleCategories";
import getReloadArticleCategories from "@salesforce/apex/CategoryController.getReloadArticleCategories";
import getArticleCategoryNumber from "@salesforce/apex/CategoryController.getArticleCategoryNumber";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ArticleCategory extends LightningElement {
  isLoaded = false;
  categoryOptions = []
  categories = []
  articleCategoryIds = []
  articleCategoryAddIds = []
  articleCategoryRemoveIds = []
  articleCategoryRelationshipIds = {}
  
  @api recordId;

  @wire(getCategories, {})
  getCategories(result) {
    if (result.data) {
      this.categories = result.data;
      this.categoryOptions = result.data.map((v) => {
        return {
          value: v.Id,
          label: v.Name
        }
      });
    }
  }

  @wire(getArticleCategories, { articleId: "$recordId"})
  getArticleCategories(result) {
    if (result.data) {
      this.articleCategoryIds = result.data.map(v => {
        this.articleCategoryRelationshipIds[v.Category__c] = v.Id;
        return v.Category__c
      });
    }
  }

  handleCategoryChange(event) {
    this.selectedValues = Array.from(event.detail.value.values());
    this.articleCategoryAddIds = this.selectedValues.filter(v => {
      return this.articleCategoryIds.indexOf(v) == -1;
    }).map(v => {
      return v
    });
    this.articleCategoryRemoveIds = this.articleCategoryIds.filter(v => {
      return this.selectedValues.indexOf(v) == -1;
    }).map(v => {
      return v
    });
  }

  handleCategoryUpdate() {
    this.isLoaded = true;
    Promise.resolve().then(() => {
      return new Promise((resolve, reject) => {
        if (this.articleCategoryAddIds.length != 0) {
          const createPromises = this.articleCategoryAddIds.map(v => createRecord({
            apiName: "ArticleCategoryRelationship__c",
            fields: {
              "Article__c": this.recordId,
              "Category__c": v
            }
          }));
          Promise.all(createPromises).then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }).then(() => {
      return new Promise((resolve, reject) => {
        if (this.articleCategoryRemoveIds.length != 0) {
          const deletePromises = this.articleCategoryRemoveIds.map(
            v => deleteRecord(this.articleCategoryRelationshipIds[v]));
          Promise.all(deletePromises).then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }).then(() => {
      return new Promise((resolve, reject) => {
        const updatePromises = this.categories.map(category => {
          getArticleCategoryNumber({
            categoryId: category.Id
          }).then(number => {
            updateRecord({
              fields: {
                "Id": category.Id,
                "ArticleNumber__c": number
              }
            });
          })
        });
        Promise.all(updatePromises).then(() => {
          resolve();
        });
      });
    }).then(() => {
      return new Promise((resolve, reject) => {
        this.articleCategoryRelationshipIds = {};
        getReloadArticleCategories({
          articleId: this.recordId
        }).then((result) => {
          this.articleCategoryIds = result.map((v) => {
            this.articleCategoryRelationshipIds[v.Category__c] = v.Id;
            return v.Category__c;
          });
        });
        resolve();
      });
    }).then(() => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Category Updated",
          variant: "success"
        })
      );
    }).finally(() => {
      this.isLoaded = false;
    });
  }
}