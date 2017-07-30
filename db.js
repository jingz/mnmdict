// require lib/adapter.js
// require config.js
(function (context) {
    context.init_db = function() {
        ad = new Adapter(ENV.WEB_DB_CONFIG);
        try	{
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
        } catch(e) {
            console.log(e);
        }

        try {
            if (!context.localStorage.getItem('already_refresh_db_for_version_2')) {
                ad.execute('delete from wordlist;', null, (res) => {
                    context.localStorage.setItem('already_refresh_db_for_version_2', true)
                })
            }
        } catch (e) {
            console.log(e);
        }

    }
})(window);
