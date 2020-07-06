import { LightningElement, api, wire } from 'lwc';
import { getRecord, updateRecord } from "lightning/uiRecordApi";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getHeroku from '@salesforce/apex/HerokuController.getHeroku';

const ARTICLE_FIELDS = [
  "Article__c.Name",
  "Article__c.FeaturedImage__c",
  "Article__c.QuipID__c",
  "Article__c.HTMLSource__c",
  "Article__c.SearchWords__c"
]

export default class ArticleQuip extends LightningElement {
  @api isLoaded = false;
  @api recordId;

  @wire(getHeroku)
  getHeroku(result) {
    if (result.data) {
      this.heroku_url = result.data.url__c;
    }
  }

  @wire(getRecord, {recordId: "$recordId", fields: ARTICLE_FIELDS})
  getArticle(result) {
    this.wiredArticleResults = result;
    if (result.data) {
      this.article = result.data.fields;
      this.quip_id = this.article.QuipID__c.value
    }
    if (result.error) {
      console.log(result.error);
    }
  }

  handlerQuip() {
    this.isLoaded = true;
    this.getQuipHtml(this.quip_id).then(v => {
      const recordInput = {
        fields: {
          "Id": this.recordId,
          "HTMLSource__c": v.html,
          "SearchWords__c": v.word
        }
      };
      updateRecord(recordInput).then(v => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "HTML Updated",
            variant: "success"
          })
        );
        return refreshApex(this.wiredArticleResults);
      }).catch(e => {
        console.log(e);
      });
    }).finally(() => {
      this.isLoaded = false;
    });
  }

  getQuipHtml(quip_id) {
    return new Promise((resolve, reject) => {
      this.httpRequest(
        this.heroku_url + "/api/quip?quip_id=" + quip_id,
        "GET",
        {},
        resolve,
        reject
      )
    });
  }

  httpRequest(url, method, data, resolve, reject) {
    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    xhr.open(method, url, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var response = JSON.parse(xhr.responseText);
        resolve(response);
      }
      if (xhr.status != 200) {
        reject('Error');
      }
    };
    Object.keys(data).forEach(key => {
      var value = data[key];
      if (Array.isArray(value)) {
        value.forEach(entry => {
          fd.append(key + "[]", entry);
        });
      } else {
        fd.append(key, value);
      }
    });
    xhr.send(fd);
  }
}