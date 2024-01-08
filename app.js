var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt');
const saltRounds = 10;
const secret ='Fullstack-Login'
var jwt = require('jsonwebtoken');
app.use(cors())

require('dotenv').config()

const mysql = require('mysql2')
const connection = mysql.createConnection(process.env.DATABASE_URL)
// create the connection to database
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   database: 'qdent'
// });

app.post('/register',jsonParser, function (req, res, next) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
 connection.execute(
  'INSERT INTO users (username,password,fname,lname) VALUES (?,?,?,?)',
  [req.body.username,hash,req.body.fname,req.body.lname],
  function(err, results, fields) {
    if(err){
      res.json({status:'error',massage:err})
      return
    }
    res.json({status:'ok'})
  }
);
})
})

app.post('/input_appoint',jsonParser, function (req, res, next) {
 connection.execute(
  'INSERT INTO appoint(cid,app_date,app_time,firstname,lastname,tel,dental_t) VALUES (?,?,?,?,?,?,?)',
  [req.body.cid,req.body.app_date,req.body.app_time,req.body.firstname,req.body.lastname,req.body.tel,req.body.dental_t],
  function(err, results, fields) {
    if(err){
      res.json({status:'error',massage:err})
      return
    }
    res.json({status:'ok'})
  }
);
})

app.post('/login',jsonParser, function (req, res, next) {
  connection.execute(
    'SELECT *FROM users WHERE username=?',
    [req.body.username], 
    function(err, users, fields) {
      if(err) { res.json({status:'error',massage:err}); return }
      if(users.length==0) { res.json({status:'error',massage:'no user found'}); return }
      bcrypt.compare(req.body.password, users[0].password, function(err, isLogin) {
        if(isLogin){
          var token = jwt.sign({ username:users[0].username},secret, { expiresIn: '1h' });
          res.json({status:'ok',massage:'login success',token})
        }else{
          res.json({status:'error',massage:'login failed'})
        }
    });
    }
  );
})

app.get('/authen',jsonParser, function (req, res, next) {
  try{
    const token =  req.headers.authorization.split(' ')[1]
    var decoded = jwt.verify(token,secret)
    res.json({status:'ok',decoded})
    res.json({decoded})
   
  }catch(err){
    res.json({status:'error',message:err.message})

  }
  
})

app.get('/get_extract/:app_date',jsonParser, function (req, res, next) {
  const app_date = req.params.app_date;
  connection.execute(
    'select * from appoint where dental_t = 1 AND  app_date = ?',
    [app_date],
    function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })

app.get('/get_impacted/:app_date',jsonParser, function (req, res, next) {
  const app_date = req.params.app_date;
  connection.execute(
   'select * from appoint where dental_t = 2 AND  app_date = ?',
   [app_date],
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })


 app.get('/day_count/:day_name',jsonParser, function (req, res, next) {
  const day_name = req.params.day_name;
  connection.execute(
   'select * from reserves where day_name = ?',
   [day_name],
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })

 app.get('/get_type',jsonParser, function (req, res, next) {
  connection.execute(
   'select * from dental_type',
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })

 app.get('/get_allday',jsonParser, function (req, res, next) {
  connection.execute(
   'select * from reserves',
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })

 app.get('/get_nameappoint',jsonParser, function (req, res, next) {
  connection.execute(
   'SELECT firstname,lastname,cid,tel,app_time,app_date from appoint where app_date ',
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })

  app.get('/get_holidays',jsonParser, function (req, res, next) {
  connection.execute(
   'select * from holidays',
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })  

 app.get('/get_fulldatedent1/:app_YEAR/MONTH/:app_MONTH',jsonParser, function (req, res, next) {
  const app_YEAR = req.params.app_YEAR;
  const app_MONTH = req.params.app_MONTH;

  connection.execute(
   'Select count(app_date) as counted, app_date as f_date from appoint where dental_t = 1 AND YEAR(app_date)=?  AND MONTH(app_date)=? group by app_date HAVING COUNT(*) >= 3',
   [app_YEAR , app_MONTH],
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })

//  app.get('/get_fulldatedent1',jsonParser, function (req, res, next) {
  
//   connection.execute(
//    'Select count(app_date) as counted, app_date as f_date from appoint where dental_t = 1  group by app_date HAVING COUNT(*) >= 3',
//    function(err, results, fields) {
//      if(err){
//        res.json({status:'error',massage:err})
//        return
//      }
//      res.json(results)
//    }
//  );
 
//  })

  app.get('/get_freedatedent1/:app_date',jsonParser, function (req, res, next) {
    const app_date = req.params.app_date;
  connection.execute(
   'Select 3-COUNT(app_date) as "freedate" from appoint  where dental_t = 1   AND app_date =?',
   [app_date],
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results[0]['freedate'])
   }
 );
 
 })

 app.get('/get_fulldatedent2/:app_YEAR/MONTH/:app_MONTH',jsonParser, function (req, res, next) {
  const app_YEAR = req.params.app_YEAR;
  const app_MONTH = req.params.app_MONTH;
  connection.execute(
   'Select count(app_date) as counted, app_date as f_date from appoint where dental_t = 2 AND YEAR(app_date)=?  AND MONTH(app_date)=? group by app_date HAVING COUNT(*) >= 1  ',
   [app_YEAR , app_MONTH],
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })

 app.get('/get_freedatedent2/:app_date',jsonParser, function (req, res, next) {
  const app_date = req.params.app_date;
connection.execute(
 'Select 1-COUNT(app_date) as "freedate" from appoint  where dental_t = 2   AND app_date =?',
 [app_date],
 function(err, results, fields) {
   if(err){
     res.json({status:'error',massage:err})
     return
   }
   res.json(results[0]['freedate'])
 }
);

})


 app.get('/get_appoint',jsonParser, function (req, res, next) {
  connection.execute(
   'select * from appoint',
   function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json(results)
   }
 );
 
 })

 app.delete('/deleteHoliday/:H_id',jsonParser, function (req, res, next) {
  const H_id = req.params.H_id;
  connection.execute(
    'DELETE FROM holidays WHERE H_id=?',
    [H_id],
   function(err, results, fields) {
    if(err){
      res.json({status:'error',massage:err})
      return
    }
    res.json({status:'ok'})
  }
); 
 })

   app.post('/input_holidays',jsonParser, function (req, res, next) {
  
   connection.execute(
    'INSERT INTO holidays(H_DATE,H_NAME) VALUES (?,?)',
    [req.body.h_date,req.body.h_name],
    function(err, results, fields) {
      if(err){
        res.json({status:'error',massage:err})
        return
      }
      res.json({status:'ok'})
    }
  );
  })

 
  app.put('/updateHoliday/:H_id',jsonParser, function (req, res, next) {
    const H_id = req.params.H_id;
    connection.execute(
      'UPDATE holidays SET H_DATE=?, H_NAME=? WHERE H_id =?',
     [req.body.h_date,req.body.h_name,H_id],
     function(err, results, fields) {
       if(err){
         res.json({status:'error',massage:err})
         return
       }
       res.json({status:'ok'})
     }
   );
   })


app.listen(3333, function () {
 
})


