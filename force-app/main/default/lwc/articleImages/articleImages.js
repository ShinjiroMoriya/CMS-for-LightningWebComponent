import { LightningElement, wire, api } from 'lwc';
import { getRecord, createRecord, updateRecord } from "lightning/uiRecordApi";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getImages from "@salesforce/apex/ImageController.getImages";
import getImagesCount from "@salesforce/apex/ImageController.getImagesCount";
import getHeroku from "@salesforce/apex/HerokuController.getHeroku";

const ARTICLE_FIELDS = [
  "Article__c.Name",
  "Article__c.FeaturedImage__c"
]

const IMAGE_FIELDS = [
  "Image__c.Name",
  "Image__c.ImageUrl__c",
  "Image__c.ImageId__c"
]

export default class ArticleImages extends LightningElement {
  images = [];
  isLoaded = false;
  openmodel = false;
  imageUrl = null;
  offset = 0;
  prevOffset = 0;
  imageTotal = 0;
  totalPage = 0;
  currentPage = 1;
  perPage = 8;
  prevFlag = false;
  nextFlag = true;
  search = null;

  @api recordId;
  @api imageId;

  @wire(getHeroku)
  getHeroku(result) {
    if (result.data) {
      this.heroku_url = result.data.url__c;
    }
    if (result.error) {
      console.log(result.error);
    }
  }

  @wire(getImages, {offset: "$offset", perPage : "$perPage"})
  getImages(result) {
    this.wiredImagesResults = result;
    if (result.data) {
      this.images = result.data;
    }
    if (result.error) {
      console.log(result.error);
    }
  }

  @wire(getImagesCount, {})
  getImagesCount(result) {
    if (result.data) {
      this.imageTotal = result.data;
      this.totalPage = Math.ceil(this.imageTotal / this.perPage)
      if (this.totalPage == 1) {
        this.nextFlag = false;
      }
    }
    if (result.error) {
      console.log(result.error);
    }
  }

  @wire(getRecord, {recordId: "$recordId", fields: ARTICLE_FIELDS})
  getArticle(result) {
    this.wiredArticleResults = result;
    if (result.data) {
      this.article = result.data.fields;
      this.imageId = this.article.FeaturedImage__c.value
    }
    if (result.error) {
      console.log(result.error);
    }
  }

  @wire(getRecord, {recordId: "$imageId", fields: IMAGE_FIELDS})
  getImage(result) {
    this.wiredImageResults = result;
    if (result.data) {
      this.image = result.data.fields;
      this.imageUrl = this.image.ImageUrl__c.value;
    }
    if (result.error) {
      console.log(result.error);
    }
  }

  openmodal() {
    this.openmodel = true;
  }

  closeModal() {
    this.openmodel = false;
  }

  handlerImageDelete() {
    const recordInput = {
      fields: {
        "Id": this.recordId,
        "FeaturedImage__c": ""
      }
    };
    updateRecord(recordInput).then(() => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Image Updated",
          variant: "success"
        })
      );
      return refreshApex(this.image);
    }).catch(e => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: e,
          variant: "error"
        })
      );
    });
  }

  handlePrev() {
    this.prevOffset = this.offset;
    this.offset = this.offset - this.perPage;
    this.currentPage -= 1;
    this.nextFlag = true;
    if (this.currentPage == 1) {
      this.prevFlag = false;
    }
  }

  handleNext() {
    this.prevOffset = this.offset;
    this.offset = this.offset + this.perPage;
    this.currentPage += 1;
    this.prevFlag = true;
    if (this.currentPage == this.totalPage) {
      this.nextFlag = false;
    }
  }

  handleSearch(event) {
    const isEnterKey = event.keyCode === 13;
    if (isEnterKey) {
      this.search = event.target.value;
      getImages({
        offset: this.offset,
        perPage : this.perPage,
        search: this.search
      }).then(result => {
        this.images = result;
      });
      getImagesCount({
        search: this.search
      }).then(result => {
        this.imageTotal = result;
        this.totalPage = Math.ceil(this.imageTotal / this.perPage)
        this.nextFlag = this.totalPage != 1;
        this.prevFlag = false;
      });
    }
  }

  selectImage(event) {
    const imageSfid = event.currentTarget.getAttribute("data-sfid");
    const recordInput = {
      fields: {
        "Id": this.recordId,
        "FeaturedImage__c": imageSfid
      }
    };

    this.closeModal();

    updateRecord(recordInput).then(() => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Success",
          message: "Image Updated",
          variant: "success"
        })
      );
      return refreshApex(this.image);
    }).catch(e => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: e,
          variant: "error"
        })
      );
    });
  }

  handleImageUpload(event) {
    this.isLoaded = true;
    var file = event.target.files[0];
    this.uploadAction(file).then(res => {
      const recordInput = {
        apiName: "Image__c",
        fields: {
          "Name": file.name,
          "ImageId__c": res.public_id,
          "CloudinaryUrl__c": res.cloudinary_url
        }
      };
      createRecord(recordInput).then(() => {
        this.isLoaded = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Image updated",
            variant: "success"
          })
        );
        return refreshApex(this.wiredImagesResults);
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