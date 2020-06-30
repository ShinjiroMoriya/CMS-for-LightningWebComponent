public with sharing class ImageController {
    @AuraEnabled(cacheable=true)
    public static List<Image__c> getImages() {
        return [
            SELECT
                Id,
                ImageId__c,
                ImageUrl__c
            FROM
                Image__c
        ];
    }
}
