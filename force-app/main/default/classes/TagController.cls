public with sharing class TagController {
    @AuraEnabled(cacheable=true)
    public static List<Tag__c> getTagByName(String name) {
        return [
            SELECT
                Id,
                Name,
                Slug__c,
                CreatedDate
            FROM
                Tag__c
            WHERE
                Name=:name
        ];
    }
    @AuraEnabled(cacheable=true)
    public static List<Tag__c> getTags(String search) {
      if (search != null) {
        search = '%' + search + '%';
        return [
            SELECT
                Id,
                Name,
                Slug__c,
                CreatedDate
            FROM
                Tag__c
            WHERE
                Name LIKE :search
            ORDER BY
                CreatedDate DESC
        ];
      } else {
        return [
            SELECT
                Id,
                Name,
                Slug__c,
                CreatedDate
            FROM
                Tag__c
            ORDER BY
                CreatedDate DESC
        ];
      }
    }
    @AuraEnabled(cacheable=true)
    public static List<ArticleTagRelationship__c> getArticleTags(String articleId) {
        return [
            SELECT
                Id,
                Article__c,
                Tag__c,
                Tag__r.Name,
                CreatedDate
            FROM
                ArticleTagRelationship__c
            WHERE
                Article__c=:articleId
            ORDER BY
                CreatedDate DESC
        ];
    }
    @AuraEnabled(cacheable=false)
    public static List<ArticleTagRelationship__c> getReloadArticleTags(String articleId) {
        return [
            SELECT
                Id,
                Article__c,
                Tag__c,
                CreatedDate
            FROM
                ArticleTagRelationship__c
            WHERE
                Article__c=:articleId
            ORDER BY
                CreatedDate DESC
        ];
    }
    @AuraEnabled(cacheable=false)
    public static Integer getArticleTagNumber(String TagId) {
        return [
            SELECT
                count()
            FROM
                ArticleTagRelationship__c
            WHERE
                Tag__c=:TagId
        ];
    }
}