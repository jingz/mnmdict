// class ActiveRecord in coffeescript style
AR = (function () {

    function AR(attrs, cb) {
        // this in this scope is an instance scope
        var self = this;
        attrs = attrs || {};
        if(self.class._columns){
            var cols_vals = {};
            var cols = self.class._columns;
            for(var i in cols){
                cols_vals[cols[i]] = null;
                self.__defineGetter__(cols[i], function() {
                    return self.attributes[cols[i]];
                });
                self.__defineSetter__(cols[i], function(v) {
                    return self.attributes[cols[i]] = v;
                });
            }
            var found;
            for(var k in attrs){
                found = false;
                for(var _k in cols_vals){
                    if(k == _k){
                        found = true;
                        break;
                    }
                }

                if(found){
                    cols_vals[k] = attrs[k];
                } else{
                    throw "not found " + k + " in " + self.class.table_name;
                }
            }
            self.attributes = cols_vals;
            if(typeof cb == "function") cb.call(self);
        } else{
            AR.columns.call(self.class, function(cols) {
                // init columns values
                // memo
                self.class._columns = cols;
                var cols_vals = {};
                for(var i in cols){
                    cols_vals[cols[i]] = null;
                    self.__defineGetter__(cols[i], function() {
                        return self.attributes[cols[i]];
                    });
                    self.__defineSetter__(cols[i], function(v) {
                        return self.attributes[cols[i]] = v;
                    });
                }
                var found;
                for(var k in attrs){
                    found = false;
                    for(var _k in cols_vals){
                        if(k == _k){
                            found = true;
                            break;
                        }
                    }

                    if(found){
                        cols_vals[k] = attrs[k];
                    } else{
                        throw "not found " + k + " in " + self.class.table_name;
                    }
                }
                self.attributes = cols_vals;
                if(typeof cb == "function") cb.call(self);
            });
        }
    }

    AR.connection = new Adapter(ENV.WEB_DB_CONFIG);

    AR.columns = function(cb) {
        // this in this scope is an class scope
        // like self.method in ruby
        this.connection.columns(this.table_name, cb);
    };

    AR.all = function(cb) {
        this.find_by_sql("select * from " + this.table_name, cb);
    };

    AR.find_by_sql = function(sql, params, cb) {
       var self = this;
       params = params || [];
       this.connection.execute(sql, params, function(recs) {
           var ar_records = [];
           for(i = 0; i < recs.length; i++){
               new self(recs[i], function() {
                   ar_records.push(this);
               });
           }
           cb.apply(self, ar_records);   
       });
    }

    AR.find = function  (id, cb) {
        this.find_by_sql("select * from " + this.table_name + " limit 1;", [], cb);
    }

    AR.prototype.save = function(cb){
        var attrs = this.attributes;
        if(attrs.id){
            // update
            var sql = [], params = [];
            sql.push("update " + this.class.table_name);
            sql.push("set");
            var _set = [];
            for(col in attrs){
                _set.push(col + " = ?");
                params.push(attrs[col]);
            }
            sql.push(_set.join(", "));
            sql.push("where id = ?");
            params.push(attrs.id);
            var statement = sql.join(" ");
        } else{
            // create
            var sql = [], params = [];
            sql.push("insert into " + this.class.table_name);
            var _cols = [], _vals = [];
            for(col in attrs){
                _cols.push(col);
                _vals.push("?");
                params.push(attrs[col]);
            }
            sql.push("(" + _cols.join(", ") + ") values (" + _vals.join(",") + ")");
            var statement = sql.join(" ");
        }
        AR.connection.execute(statement, params, cb);
    }

    AR.prototype.update = function(attrs) {
        attrs = attrs || {};
        return "update";
    }

    AR.prototype.class = AR;
    return AR; 
})();

