(function (context) {
    context.ENV = {
        WEB_DB_CONFIG: {
            database: 'mnmdict',
            table: 'mnmdict2',
            size: 100*1024*1024,
            version: "1.0"
        },
        SYNC_ID_KEY: 'last_sync_id'
    }
})(window);
