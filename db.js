// require lib/adapter.js
// require config.js
(function  (context) {
    context.init_db = function() {
        try	{
            ad = new Adapter(ENV.WEB_DB_CONFIG);
            ad.execute("create table wordlist(id integer primary key autoincrement, \
                                                     word unique,                   \
                                                     meaning,                       \
                                                     full_meaning,                  \
                                                     sound_uk,                      \
                                                     sound_us,                      \
                                                     created_at,                    \
                                                     from_site,                     \
                                                     context)");
        } catch(e){
            console.log(e);
        }
    }
})(window);
