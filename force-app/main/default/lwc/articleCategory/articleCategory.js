import { LightningElement, wire } from 'lwc';
import getCategories from '@salesforce/apex/CategoryController.getCategories';

export default class ArticleCategory extends LightningElement {
  options = []
  @wire(getCategories, {})
  getCategories({ error, data }) {
    if (data) {
      this.options = data.map((v) => {
        return {
          value: v.Id,
          label: v.Name
        }
      });
    }
    if (error) {
      console.log(error);
    }
  }

  // value = [];

  // get options() {
  //   return [
  //       { label: 'Ross', value: 'option1' },
  //       { label: 'Rachel', value: 'option2' },
  //   ];
  // }

  handleChange(event) {
  }
}