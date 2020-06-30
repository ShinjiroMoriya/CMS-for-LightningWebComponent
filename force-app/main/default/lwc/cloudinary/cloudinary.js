import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue, updateRecord } from "lightning/uiRecordApi";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getImages from '@salesforce/apex/ImageController.getImages';
import getHeroku from '@salesforce/apex/HerokuController.getHeroku';

const IMAGE_FIELDS = [
  "Image__c.Name",
  "Image__c.ImageUrl__c",
  "Image__c.ImageId__c"
]

export default class Cloudinary extends LightningElement {

  @api isLoaded = false;
  @api recordId;

  @wire(getHeroku)
  getHeroku({ error, data }) {
    if (data) {
      this.heroku_url = data.url__c;
    }
    if (error) {
      console.log(error);
    }
  }

  @wire(getImages, {})
  getImages({ error, data }) {
    if (data) {
      this.images = data;
    }
    if (error) {
      console.log(error);
    }
  }

  @wire(getRecord, { 
    recordId: "$recordId", fields: IMAGE_FIELDS
  }) image;

  get image_url() {
    return getFieldValue(this.image.data, "Image__c.ImageUrl__c");
  }

  get image_id() {
    return getFieldValue(this.image.data, "Image__c.ImageId__c");
  }

  handleImageUpload(event) {
    this.isLoaded = true;
    var file = event.target.files[0];
    this.uploadAction(file).then(res => {
      const recordInput = {
        fields: {
          "Id": this.recordId,
          "ImageId__c": res.public_id,
          "CloudinaryUrl__c": res.cloudinary_url
        }
      };
      updateRecord(recordInput).then(() => {
        this.isLoaded = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "image updated",
            variant: "success"
          })
        );
        return refreshApex(this.image);
      })
    }).catch(e => {
      this.isLoaded = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: e,
          variant: "error"
        })
      );
    });
  }

  handleImageDelete(event) {
    if (window.confirm("削除してよろしいですか？")) {
      this.isLoaded = true;
      this.deleteAction(this.image_id).then(res => {
        const recordInput = {
          fields: {
            "Id": this.recordId,
            "ImageId__c": "",
            "CloudinaryUrl__c": ""
          }
        };
        updateRecord(recordInput).then(() => {
          this.isLoaded = false;
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success",
              message: "Image deleted",
              variant: "success"
            })
          );
          return refreshApex(this.image);
        })
      }).catch(e => {
        this.isLoaded = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: e,
            variant: "error"
          })
        );
      });
    }
  }

  uploadAction(file) {
    return new Promise((resolve, reject) => {
      this.httpRequest(
        this.heroku_url + "/api/upload",
        "POST",
        {
          "upload_file": file
        },
        resolve,
        reject
      )
    });
  }

  deleteAction(image_id) {
    return new Promise((resolve, reject) => {
      this.httpRequest(
        this.heroku_url + "/api/delete",
        "POST",
        {
          "public_id": image_id
        },
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