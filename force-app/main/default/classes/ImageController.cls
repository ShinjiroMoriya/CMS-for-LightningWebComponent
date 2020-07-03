public with sharing class ImageController {
    @AuraEnabled(cacheable=true)
    public static List<Image__c> getImages(Integer offset, Integer perPage, String search) {
        if (search != null) {
            search = '%' + search + '%';
            return [
                SELECT
                    Id,
                    Name,
                    ImageId__c,
                    ImageUrl__c,
                    ImageThumbnail__c,
                    LastModifiedDate
                FROM
                    Image__c
                WHERE
                    Name LIKE :search
                ORDER BY
                    LastModifiedDate DESC
                LIMIT :perPage
                OFFSET :offset
            ];
        } else {
            return [
                SELECT
                    Id,
                    Name,
                    ImageId__c,
                    ImageUrl__c,
                    ImageThumbnail__c,
                    LastModifiedDate
                FROM
                    Image__c
                ORDER BY
                    LastModifiedDate DESC
                LIMIT :perPage
                OFFSET :offset
            ];
        }
    }
    @AuraEnabled(cacheable=true)
    public static Integer getImagesCount(String search) {
        if (search != null) {
            search = '%' + search + '%';
            return [
                SELECT
                    count()
                FROM
                    Image__c
                WHERE
                    Name LIKE :search
            ];
        } else {
            return [
                SELECT
                    count()
                FROM
                    Image__c
            ];
        }
    }
}
