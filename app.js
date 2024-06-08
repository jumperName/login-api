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

const mysql = require('mysql2')
require('dotenv').config()

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE
// });


  // const connection = mysql.createConnection(process.env.DATABASE_URL)

const connection = mysql.createPool({
  host:  process.env.DB_HOST,
  user:  process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

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
  'INSERT INTO appoint(cid,app_date,app_time,firstname,lastname,tel,dental_t,app_line,timestamp) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)',
  [req.body.cid,req.body.app_date,req.body.app_time,req.body.firstname,req.body.lastname,req.body.tel,req.body.dental_t,req.body.app_line],
  function(err, results, fields) {
    if(err){
      res.json({status:'error',massage:err})
      return
    }
    res.json({status:'ok'})
  }
);
})

app.post('/input_appointImpace',jsonParser, function (req, res, next) { //เช็คไม่ให้จองซ้ำใน7วัน
  connection.execute(
   'INSERT INTO appoint(cid,app_date,app_time,firstname,lastname,tel,dental_t,app_line,timestamp) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)',
   [req.body.cid,req.body.app_date,req.body.app_time,req.body.firstname,req.body.lastname,req.body.tel,req.body.dental_t,req.body.app_line],
   function(err, results, fields) {
    if(results.length==0) { res.json({status:'error',massage:'no user found'}); return }
     if(err){
       res.json({status:'error',massage:err})
       return
     }
     res.json({status:'ok'})
   }
 );
 })

 
 app.post('/Check_dent1',jsonParser, function (req, res, next) {
  connection.execute(
    'select * from appoint  where dental_t = 1   AND app_date < now() - INTERVAL-7  day  AND cid=? AND firstname=? AND lastname=? ORDER BY app_date ASC',
    [req.body.cid,req.body.firstname,req.body.lastname], 
    function(err, appoint, fields) {
     
      if(appoint.length==1) { 
      
        res.json({status:'ไม่สามารถจองคิวได้เนื่องจากคุณได้มีการจองคิวแล้ว',massage:''}); 
      

        return
       }   
      
    }
  );
})


 app.post('/Check_dent2',jsonParser, function (req, res, next) {
  connection.execute(
    'select * from appoint  where dental_t = 2   AND app_date > now() - INTERVAL-7  day AND app_date < now() - INTERVAL-15  day  AND cid=? AND firstname=? AND lastname=? ORDER BY app_date ASC',
    [req.body.cid,req.body.firstname,req.body.lastname], 
    function(err, appoint, fields) {
     
      if(appoint.length==1) { 
      
        res.json({status:'ไม่สามารถจองคิวได้เนื่องจากคุณได้มีการจองคิวแล้ว',massage:''}); 
      

        return
       }   
      
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

app.get('/get_extract/:app_date',jsonParser, function (req, res, next) { //ตัวเดิม
  const app_date = req.params.app_date;
  connection.execute(
    'select * from appoint where dental_t = 1 AND  app_date = ?',
    [app_date],
    function(err, results, fields) {
     if(err){
       res.json({status:'error',massage:get_impactederr})
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

 app.get('/get_alldatedent1/:app_YEAR/MONTH/:app_MONTH',jsonParser, function (req, res, next) {
  const app_YEAR = req.params.app_YEAR;
  const app_MONTH = req.params.app_MONTH;

  connection.execute(
   'Select  * from appoint where dental_t = 1 AND YEAR(app_date)=?  AND MONTH(app_date)=? ',
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

 
 app.get('/get_alldatedent1v2/:app_YEAR/MONTH/:app_MONTH',jsonParser, function (req, res, next) {
  const app_YEAR = req.params.app_YEAR;
  const app_MONTH = req.params.app_MONTH;

  connection.execute(
   'Select  * from appoint where dental_t = 1 AND YEAR(app_date)=?  AND MONTH(app_date)=? ORDER BY app_date ASC ',
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

 app.get('/get_dayoffdent1/:app_YEAR/MONTH/:app_MONTH',jsonParser, function (req, res, next) {
  const app_YEAR = req.params.app_YEAR;
  const app_MONTH = req.params.app_MONTH;

  connection.execute(
   'Select  * from dayoff where dental_t = 1 AND YEAR(d_date)=?  AND MONTH(d_date)=? ',
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

 app.get('/get_alldatedent2/:app_YEAR/MONTH/:app_MONTH',jsonParser, function (req, res, next) {
  const app_YEAR = req.params.app_YEAR;
  const app_MONTH = req.params.app_MONTH;

  connection.execute(
   'Select  * from appoint where dental_t = 2 AND YEAR(app_date)=?  AND MONTH(app_date)=? ',
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

 app.get('/get_alldatedent2V2/:app_YEAR/MONTH/:app_MONTH',jsonParser, function (req, res, next) {
  const app_YEAR = req.params.app_YEAR;
  const app_MONTH = req.params.app_MONTH;

  connection.execute(
   'Select  * from appoint where dental_t = 2 AND YEAR(app_date)=?  AND MONTH(app_date)=? ORDER BY app_date ASC ',
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


 
 app.get('/get_dayoffdent2/:app_YEAR/MONTH/:app_MONTH/MONTH2/:app_MONTH2',jsonParser, function (req, res, next) {
  const app_YEAR = req.params.app_YEAR;
  const app_MONTH = req.params.app_MONTH;
  const app_MONTH2 = req.params.app_MONTH2;

  connection.execute(
   'Select  * from dayoff where dental_t = 2 AND YEAR(d_date)=?  AND MONTH(d_date)=? or MONTH(d_date) =? ',
   [app_YEAR , app_MONTH,app_MONTH2],
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

//  app.get('/get_fulldatedent22/:app_YEAR/MONTH/:app_MONTH/MONTH2/:app_MONTH2',jsonParser, function (req, res, next) {
  
 app.get('/get_fulldatedent22/:app_YEAR/MONTH/:app_MONTH/MONTH2/:app_MONTH2',jsonParser, function (req, res, next) {
  const app_YEAR = req.params.app_YEAR;
  const app_MONTH = req.params.app_MONTH;
  const app_MONTH2 = req.params.app_MONTH2;
  connection.execute(
   'Select count(app_date) as counted, app_date as f_date from appoint where dental_t = 2 AND YEAR(app_date)=?  AND (MONTH(app_date) =? or MONTH(app_date) =?) group by app_date HAVING COUNT(*) >= 1  ',
   [app_YEAR , app_MONTH,app_MONTH2],
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

   app.get('/get_dayoff',jsonParser, function (req, res, next) {
    connection.execute(
     'select d_id,d_date,d_name ,d.dental_name from  dayoff as o INNER JOIN dental_type as d ON o.dental_t = d.dental_t;',
     function(err, results, fields) {
       if(err){
         res.json({status:'error',massage:err})
         return
       }
       res.json(results)
     }
   );
   
   })
  
   app.delete('/deleteDayoff/:d_id',jsonParser, function (req, res, next) {
    const d_id = req.params.d_id;
    connection.execute(
      'DELETE FROM dayoff WHERE d_id=?',
      [d_id],
     function(err, results, fields) {
      if(err){
        res.json({status:'error',massage:err})
        return
      }
      res.json({status:'ok'})
    }
  ); 
   })
  
     app.post('/input_Dayoff',jsonParser, function (req, res, next) {
    
     connection.execute(
      'INSERT INTO dayoff(d_date,d_name,dental_t) VALUES (?,?,?)',
      [req.body.d_date,req.body.d_name,req.body.dental_t],
      function(err, results, fields) {
        if(err){
          res.json({status:'error',massage:err})
          return
        }
        res.json({status:'ok'})
      }
    );
    })
  
   
    app.put('/updateDayoff/:d_id',jsonParser, function (req, res, next) {
      const d_id = req.params.d_id;
      connection.execute(
        'UPDATE dayoff SET d_date=?, dental_t=? WHERE d_id =?',
       [req.body.d_date,req.body.dental_t,d_id],
       function(err, results, fields) {
         if(err){
           res.json({status:'error',massage:err})
           return
         }
         res.json({status:'ok'})
       }
     );
     })

    //  app.listen(process.env.PORT || 3000)
 app.listen(5000, function () {
 
 })


