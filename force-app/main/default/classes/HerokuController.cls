public with sharing class HerokuController {
    @AuraEnabled(cacheable=true)
    public static Heroku__c getHeroku() {
        return [
            SELECT
                Id,
                url__c
            FROM
                Heroku__c
            LIMIT 1
        ];
    }

}
