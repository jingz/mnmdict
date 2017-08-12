// require lib/adapter.js
// require config.js
(function (context) {
    context.init_db = function() {
        ad = new Adapter(ENV.WEB_DB_CONFIG);
        try	{
            if (context.localStorage.getItem('db_version') != '2') {
                ad.execute('drop table if exists wordlist;', null, function () {
                    var create_table_qry = [];
                    create_table_qry.push("create table wordlist(id integer primary key autoincrement,");
                    create_table_qry.push("word,");
                    create_table_qry.push("meaning,");
                    create_table_qry.push("syn,");
                    create_table_qry.push("ant,");
                    create_table_qry.push("is_english boolean,");
                    create_table_qry.push("phonetic,");
                    create_table_qry.push("sound_uk,");
                    create_table_qry.push("sound_us,");
                    create_table_qry.push("created_at,");
                    create_table_qry.push("from_site,");
                    create_table_qry.push("context )");
                    ad.execute(create_table_qry.join(" "), null, function () {
                      context.localStorage.setItem('db_version', '2') 
                      // reset sync id
                      context.localStorage.setItem(context.ENV.SYNC_ID_KEY, 0) 
                    });
                })
            }
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
