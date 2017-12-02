// web_db = new Adapter(WEB_DB_COFIG);
var Adapter;
Adapter = (function() {
    
    // class constructor
    function Adapter(config) {
      if (window.openDatabase) {
        this.connection = window.openDatabase(config.database, config.version, config.table, config.size);
      } else {
        console.log("the browser not support WebSQL")
        return false
      }
    }

    // @sql : an sql statement that will be excuted
    // @params : an array of params that corresponding to number of 
    //           ?'s in @sql
    // @cb_rec : an function callback that accept array of records
    // @cb_err : an function callback when errors occur
    Adapter.prototype.execute = function(sql, params, cb_rec, cb_err) {
        if(!this.connection)  return false;
        this.connection.transaction(function  (tx) {
            tx.executeSql(sql, params, function (_tx, results) {
                var records = [];
                if(results){
                    for (var i = 0; i < results.rows.length; i++) {
                        records.push(results.rows.item(i));
                    }
                 }
                 if(typeof cb_rec == "function") cb_rec(records);
            });
        }, function(error) {
            if(typeof cb_err == "function") cb_err(error);
            else console.log(error.message, sql);
        });
    }

    Adapter.prototype.columns = function(table, cb) {
        this.execute("select * from sqlite_master where name = ? and type = ?", [table, 'table'], function(recs){
            var item = recs[0];
            if(!item){ throw "not found meta data for " + table + " in sqlite_master"; }
            var columnParts = item.sql.replace(/^[^\(]+\(([^\)]+)\)/g, '$1').split(',');
            var columnNames = [];
            for(i in columnParts) {
               if(typeof columnParts[i] === 'string'){
                    var part = columnParts[i].replace(/^\s*/g, '');
                    columnNames.push(part.split(" ")[0]);
               }
            }
            cb(columnNames);
        });
    }

    return Adapter;
})();
