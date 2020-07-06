import { LightningElement, wire, api } from "lwc";
import { createRecord, updateRecord, deleteRecord } from "lightning/uiRecordApi";
import getTags from "@salesforce/apex/TagController.getTags";
import getTagByName from "@salesforce/apex/TagController.getTagByName";
import getArticleTags from "@salesforce/apex/TagController.getArticleTags";
import getArticleTagNumber from "@salesforce/apex/TagController.getArticleTagNumber";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ArticleTag extends LightningElement {
  isLoaded = false;
  tags = []
  articleTagIds = []
  articleTagOptions = []
  articleTagAddIds = []
  articleTagRemoveIds = []
  articleTagRelationshipIds = {}
  createTagValue = null;

  @api recordId;

  @wire(getArticleTags, { articleId: "$recordId"})
  getArticleTags(result) {
    if (result.data) {
      this.articleTagOptions = result.data.map(v => {
        return {
          value: v.Tag__c,
          label: v.Tag__r.Name
        }
      });
      this.articleTagIds = result.data.map(v => {
        return v.Tag__c
      });
    }
  }

  handleSearchTag(event) {
    this.search = event.target.value;
    if (this.search.length > 1) {
      getTags({
        search: this.search
      }).then(result => {
        result.map(v => {
          this.articleTagOptions.push({
            value: v.Id,
            label: v.Name
          });
        });
        const DELIMITER = String.fromCharCode("31");
        this.articleTagOptions = Array.from(new Map(
          this.articleTagOptions.map(o => [`${o.value}${DELIMITER}${o.label}`, o])
        ).values());
      });
    }
  }

  handleTagChange(event) {
    this.selectedValues = Array.from(event.detail.value.values());
    this.articleTagAddIds = this.selectedValues.filter(v => {
      return this.articleTagIds.indexOf(v) == -1;
    }).map(v => {
      return v
    });

    this.articleTagRemoveIds = this.articleTagIds.filter(v => {
      return this.selectedValues.indexOf(v) == -1;
    }).map(v => {
      return v
    });
  }

  stringToSlugify(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/&/g, '-and-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  }

  handleCreateTagValue(event) {
    this.createTagValue = event.detail.value;
  }

  handleTagCreate() {
    this.isLoaded = true;

    Promise.resolve().then(() => {
      return new Promise((resolve, reject) => {
        getTagByName({
          name: this.createTagValue
        }).then(result => {
          if (result.length !== 0) {
            reject("既に存在します。");
          } else {
            resolve();
          }
        }).catch(e => {
          reject(e);
        });
      });
    }).then(() => {
      return new Promise((resolve, reject) => {
        createRecord({
          apiName: "Tag__c",
          fields: {
            "Name": this.createTagValue,
            "Slug__c": this.stringToSlugify(this.createTagValue)
          }
        }).then(result => {
          this.articleTagAddOptions = [{
            value: result.id,
            label: result.fields.Name.value
          }];
          this.articleTagOptions.map(v => {
            this.articleTagAddOptions.push(v);
          });
          this.articleTagOptions = this.articleTagAddOptions; 
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: "Tag Created",
              variant: "success"
            })
          );
          resolve();
        }).catch(e => {
          reject(e);
        });
      });
    }).catch(e => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Error",
          variant: "error"
        })
      );
    }).finally(() => {
      this.createTagValue = null;
      this.isLoaded = false;
    });
  }

  handleTagUpdate() {
    this.isLoaded = true;
    Promise.resolve().then(() => {
      return new Promise((resolve, reject) => {
        if (this.articleTagAddIds.length != 0) {
          const createPromises = this.articleTagAddIds.map(v => createRecord({
            apiName: "ArticleTagRelationship__c",
            fields: {
              "Article__c": this.recordId,
              "Tag__c": v
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
        if (this.articleTagRemoveIds.length != 0) {
          const deletePromises = this.articleTagRemoveIds.map(
            v => deleteRecord(this.articleTagRelationshipIds[v]));
          Promise.all(deletePromises).then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }).then(() => {
      return new Promise((resolve, reject) => {
        const updatePromises = this.articleTagOptions.map(tag => {
          getArticleTagNumber({
            TagId: tag.value
          }).then(number => {
            updateRecord({
              fields: {
                "Id": tag.value,
                "ArticleNumber__c": number
              }
            });
          }).catch(e => {
            reject(e);
          });
        });
        Promise.all(updatePromises).then(() => {
          resolve();
        });
      });
    }).then(() => {
      return new Promise((resolve, reject) => {
        this.articleTagRelationshipIds = {};
        getReloadArticleTags({
          articleId: this.recordId
        }).then((result) => {
          this.articleTagIds = result.map((v) => {
            this.articleTagRelationshipIds[v.Tag__c] = v.Id;
            return v.Tag__c;
          });
        });
        resolve();
      });
    }).then(() => {
      this.isLoaded = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Tag Updated",
          variant: "success"
        })
      );
    })
  }
}