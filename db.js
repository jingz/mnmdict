// require lib/adapter.js
// require config.js
(function  (context) {
    context.init_db = function() {
        try	{
            ad = new Adapter(ENV.WEB_DB_CONFIG);
            var create_table_qry = [];
            create_table_qry.push("create table wordlist(id integer primary key autoincrement,");
            create_table_qry.push("word unique,");
            create_table_qry.push("meaning,");
            // create_table_qry.push("sound_uk,");
            // create_table_qry.push("sound_us,");
            create_table_qry.push("created_at,");
            create_table_qry.push("from_site,");
            create_table_qry.push("context )");
            ad.execute(create_table_qry.join(" "));
        } catch(e){
            console.log(e);
        }
    }
})(window);
