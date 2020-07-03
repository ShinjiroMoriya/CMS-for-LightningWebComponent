public with sharing class CategoryController {
    @AuraEnabled(cacheable=true)
    public static List<Category__c> getCategories() {
        return [
            SELECT
                Id,
                Name,
                Slug__c,
                CreatedDate
            FROM
                Category__c
            ORDER BY
                CreatedDate DESC
        ];
    }
    @AuraEnabled(cacheable=true)
    public static List<ArticleCategoryRelationship__c> getArticleCategories(String articleId) {
        return [
            SELECT
                Id,
                Article__c,
                Category__c,
                CreatedDate
            FROM
                ArticleCategoryRelationship__c
            WHERE
                Article__c=:articleId
            ORDER BY
                CreatedDate DESC
            ];
    }
    @AuraEnabled(cacheable=false)
    public static List<ArticleCategoryRelationship__c> getReloadArticleCategories(String articleId) {
        return [
            SELECT
                Id,
                Article__c,
                Category__c,
                CreatedDate
            FROM
                ArticleCategoryRelationship__c
            WHERE
                Article__c=:articleId
            ORDER BY
                CreatedDate DESC
            ];
    }
    @AuraEnabled(cacheable=false)
    public static Integer getArticleCategoryNumber(String categoryId) {
        return [
            SELECT
                count()
            FROM
                ArticleCategoryRelationship__c
            WHERE
                Category__c=:categoryId
        ];
    }
}