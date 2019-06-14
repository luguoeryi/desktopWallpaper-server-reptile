let mysql      = require('mysql');
let connection = mysql.createConnection({
  host     : '172.19.43.48',
  port     : '3306',
  user     : 'root',
  password : 'Node@111',
  // database: 'wallpaper',
});
 
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  console.log('connected as id ' + connection.threadId);
});
module.exports = connection;