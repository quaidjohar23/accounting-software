const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");


const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// Database Connection

const db = new sqlite3.Database(
    "./database/accounting.db",
    (err)=>{

        if(err){
            console.log("Database Error:", err.message);
        }
        else{
            console.log("SQLite Connected");
        }

    }
);


// -------------------------
// HOME PAGE
// -------------------------

app.get("/",(req,res)=>{

res.send("Accounting Software Running");

});

// -------------------------
// GET ALL ACCOUNTS
// -------------------------

app.get("/accounts",(req,res)=>{

    let sql = `
        SELECT *
        FROM accounts
        ORDER BY name
    `;

    db.all(sql,[],(err,rows)=>{
        if(err){
            return res.status(500).json({
                error:err.message
            });
        }
        res.json(rows);
    });
});



// -------------------------
// CREATE ACCOUNT
// -------------------------

app.post("/accounts",(req,res)=>{


    const {
        name,
        type
    } = req.body;



    let sql = `

        INSERT INTO accounts
        (
            name,
            type
        )

        VALUES (?,?)

    `;



    db.run(
        sql,
        [
            name,
            type
        ],

        function(err){


            if(err){

                return res.status(500).json({
                    error:err.message
                });

            }



            res.json({

                message:"Account Created",
                id:this.lastID

            });


        }


    );


});



// -------------------------
// CREATE JOURNAL ENTRY
// -------------------------

app.post("/journal",(req,res)=>{


    const {

        date,
        debit_account,
        credit_account,
        amount,
        description

    } = req.body;



    let sql = `

    INSERT INTO transactions
    (

        transaction_date,
        voucher_type,
        debit_account_id,
        credit_account_id,
        amount,
        description

    )

    VALUES (?,?,?,?,?,?)

    `;



    db.run(

        sql,

        [

            date,
            "Journal",
            debit_account,
            credit_account,
            amount,
            description

        ],


        function(err){


            if(err){

                return res.status(500).json({

                    error:err.message

                });

            }



            res.json({

                message:"Journal Entry Saved",
                id:this.lastID

            });


        }


    );


});


app.post("/voucher",(req,res)=>{


    const {
    
    voucher_no,
    date,
    type,
    party_name,
    debit_account,
    credit_account,
    amount,
    description
    
    }=req.body;
    
    db.get(

        `
        SELECT *
        FROM financial_years
        WHERE active=1
        `,
        
        [],
        
        (err,year)=>{
        
        
        if(date < year.start_date || date > year.end_date)
        {
        
        return res.status(400).json({
        
        error:"Voucher date is outside financial year"
        
        });
        
        
        }
        
        
        // Continue saving voucher
        
        
        });
    
    let sql = `
    
    INSERT INTO transactions
    
    (
    voucher_no,
    transaction_date,
    voucher_type,
    party_name,
    debit_account_id,
    credit_account_id,
    amount,
    description
    
    )
    
    VALUES (?,?,?,?,?,?,?,?)
    
    `;
    
    
    
    db.run(
    
    sql,
    
    [
    
    voucher_no,
    date,
    type,
    party_name,
    debit_account,
    credit_account,
    amount,
    description
    
    ],
    
    
    function(err){
    
    
    if(err){
    
    return res.status(500).json({
    
    error:err.message
    
    });
    
    }
    
    
    
    res.json({
    
    message:type+" Voucher Saved",
    id:this.lastID
    
    });
    
    
    }
    
    
    );
    
    
    
    });

// -------------------------
// START SERVER
// -------------------------


// RECEIPT VOUCHER
app.post("/voucher/receipt", (req, res) => {

    const { date, cash_account, income_account, amount, narration } = req.body;

    const sql = `
    INSERT INTO transactions
    (transaction_date, voucher_type, debit_account_id, credit_account_id, amount, description)
    VALUES (?,?,?,?,?,?)
    `;

    db.run(
        sql,
        [date, "Receipt", cash_account, income_account, amount, narration],
        function(err){
            if(err){
                return res.status(500).json({ error: err.message });
            }
            res.json({ message:"Receipt Voucher Posted", id:this.lastID });
        }
    );
});

// PAYMENT VOUCHER
app.post("/voucher/payment", (req, res) => {

    const { date, expense_account, cash_account, amount, narration } = req.body;

    const sql = `
    INSERT INTO transactions
    (transaction_date, voucher_type, debit_account_id, credit_account_id, amount, description)
    VALUES (?,?,?,?,?,?)
    `;

    db.run(
        sql,
        [date, "Payment", expense_account, cash_account, amount, narration],
        function(err){
            if(err){
                return res.status(500).json({ error: err.message });
            }
            res.json({ message:"Payment Voucher Posted", id:this.lastID });
        }
    );
});

// SALES VOUCHER
app.post("/voucher/sales", (req, res) => {

    const { date, customer_account, sales_account, amount, narration } = req.body;

    const sql = `
    INSERT INTO transactions
    (transaction_date, voucher_type, debit_account_id, credit_account_id, amount, description)
    VALUES (?,?,?,?,?,?)
    `;

    db.run(
        sql,
        [date, "Sales", customer_account, sales_account, amount, narration],
        function(err){
            if(err){
                return res.status(500).json({ error: err.message });
            }
            res.json({ message:"Sales Voucher Posted", id:this.lastID });
        }
    );
});

// PURCHASE VOUCHER
app.post("/voucher/purchase", (req, res) => {

    const { date, purchase_account, supplier_account, amount, narration } = req.body;

    const sql = `
    INSERT INTO transactions
    (transaction_date, voucher_type, debit_account_id, credit_account_id, amount, description)
    VALUES (?,?,?,?,?,?)
    `;

    db.run(
        sql,
        [date, "Purchase", purchase_account, supplier_account, amount, narration],
        function(err){
            if(err){
                return res.status(500).json({ error: err.message });
            }
            res.json({ message:"Purchase Voucher Posted", id:this.lastID });
        }
    );
});

app.get("/ledger/:id",(req,res)=>{


        const accountId=req.params.id;
        
        
        let sql=`
        
        SELECT
        
        t.transaction_date,
        t.voucher_type,
        t.description,
        
        CASE
        WHEN t.debit_account_id=?
        THEN t.amount
        ELSE 0
        END AS debit,
        
        
        CASE
        WHEN t.credit_account_id=?
        THEN t.amount
        ELSE 0
        END AS credit
        
        
        FROM transactions t
        
        
        WHERE 
        t.debit_account_id=?
        OR
        t.credit_account_id=?
        
        
        ORDER BY t.transaction_date
        
        `;
        
        
        
        db.all(
        
        sql,
        
        [
        accountId,
        accountId,
        accountId,
        accountId
        ],
        
        (err,rows)=>{
        
        
        if(err){
        
        return res.status(500)
        .json({
        error:err.message
        });
        
        }
        
        
        res.json(rows);
        
        
        });
        
        
        });

// ------------------------------------
// TRIAL BALANCE WITH DATE FILTER
// ------------------------------------

app.get("/trial-balance",(req,res)=>{


    const {
        from,
        to
    } = req.query;



    let sql = `

    SELECT

        a.id,
        a.name,
        a.type,


        COALESCE(
            SUM(
                CASE
                    WHEN t.debit_account_id = a.id
                    THEN t.amount
                    ELSE 0
                END
            ),
        0) AS debit,


        COALESCE(
            SUM(
                CASE
                    WHEN t.credit_account_id = a.id
                    THEN t.amount
                    ELSE 0
                END
            ),
        0) AS credit


    FROM accounts a


    LEFT JOIN transactions t

    ON 
        (
            a.id = t.debit_account_id
            OR
            a.id = t.credit_account_id
        )

    `;



    let params = [];



    // If dates are provided, apply filter

    if(from && to){


        sql += `

        AND t.transaction_date
        BETWEEN ? AND ?

        `;


        params.push(from,to);


    }



    sql += `

    GROUP BY 
        a.id

    ORDER BY 
        a.name

    `;



    db.all(

        sql,

        params,

        (err,rows)=>{


            if(err){


                return res.status(500).json({

                    error:err.message

                });


            }


            res.json(rows);


        }


    );


});

// PROFIT & LOSS STATEMENT
app.get("/profit-loss", (req, res) => {

    const sql = `
    SELECT 
        a.account_type,
        a.account_name,
        IFNULL(SUM(
            CASE 
                WHEN t.debit_account_id = a.id THEN t.amount
                ELSE 0
            END
        ),0) AS debit,
        IFNULL(SUM(
            CASE 
                WHEN t.credit_account_id = a.id THEN t.amount
                ELSE 0
            END
        ),0) AS credit
    FROM accounts a
    LEFT JOIN transactions t
        ON a.id = t.debit_account_id 
        OR a.id = t.credit_account_id
    WHERE a.account_type IN ('Income','Expense')
    GROUP BY a.id
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        let totalIncome = 0;
        let totalExpense = 0;

        rows.forEach(r => {
            if (r.account_type === "Income") {
                totalIncome += (r.credit - r.debit);
            } else if (r.account_type === "Expense") {
                totalExpense += (r.debit - r.credit);
            }
        });

        let netProfit = totalIncome - totalExpense;

        res.json({
            income: rows.filter(r => r.account_type === "Income"),
            expenses: rows.filter(r => r.account_type === "Expense"),
            totalIncome,
            totalExpense,
            netProfit
        });
    });
});



// BALANCE SHEET
app.get("/balance-sheet?date=2026-07-31", (req, res) => {

    const sql = `
    SELECT 
        a.type AS account_type,
        a.name,
        IFNULL(SUM(
            CASE 
                WHEN t.debit_account_id = a.id THEN t.amount
                ELSE 0
            END
        ),0) AS debit,
        IFNULL(SUM(
            CASE 
                WHEN t.credit_account_id = a.id THEN t.amount
                ELSE 0
            END
        ),0) AS credit
    FROM accounts a
    LEFT JOIN transactions t
        ON a.id = t.debit_account_id 
        OR a.id = t.credit_account_id
    WHERE a.type IN ('Asset','Liability','Equity')
    GROUP BY a.id
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        let assets = [];
        let liabilities = [];
        let equity = [];

        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;

        rows.forEach(r => {

            if (r.account_type === "Asset") {
                let balance = r.debit - r.credit;
                assets.push({ name: r.account_name, balance });
                totalAssets += balance;
            }

            if (r.account_type === "Liability") {
                let balance = r.credit - r.debit;
                liabilities.push({ name: r.account_name, balance });
                totalLiabilities += balance;
            }

            if (r.account_type === "Equity") {
                let balance = r.credit - r.debit;
                equity.push({ name: r.account_name, balance });
                totalEquity += balance;
            }

        });

        res.json({
            assets,
            liabilities,
            equity,
            totalAssets,
            totalLiabilities,
            totalEquity,
            balanceCheck: totalAssets - (totalLiabilities + totalEquity)
        });
    });
});


function generateVoucherNumber(type,callback){


                        let prefix;
                        
                        
                        if(type=="Sales")
                        prefix="SAL";
                        
                        else if(type=="Purchase")
                        prefix="PUR";
                        
                        else if(type=="Receipt")
                        prefix="REC";
                        
                        else if(type=="Payment")
                        prefix="PAY";
                        
                        else
                        prefix="JRN";
                        
                        
                        
                        db.run(
                        
                        `
                        UPDATE voucher_sequence
                        SET last_number = last_number + 1
                        WHERE type=?
                        `,
                        
                        [type],
                        
                        function(){
                        
                        
                        
                        db.get(
                        
                        `
                        SELECT last_number
                        FROM voucher_sequence
                        WHERE type=?
                        `,
                        
                        [type],
                        
                        (err,row)=>{
                        
                        
                        let number =
                        String(row.last_number)
                        .padStart(4,"0");
                        
                        
                        
                        callback(
                        prefix+"-"+number
                        );
                        
                        
                        });
                        
                        
                        });
                        
                        
                        }

const fs=require("fs-extra");


app.get("/backup",(req,res)=>{
                        
                        
                        fs.copy(
                        
                        "./database/accounting.db",
                        
                        "./backup/accounting_backup.db"
                        
                        );
                        
                        
                        res.send("Backup Completed");
                        
                        
                        });

// GET ACTIVE FINANCIAL YEAR

app.get("/financial-year",(req,res)=>{


    db.get(
    
    `
    SELECT *
    FROM financial_years
    WHERE active=1
    `,
    
    [],
    
    (err,row)=>{
    
    
    if(err){
    
    return res.status(500)
    .json({
    error:err.message
    });
    
    }
    
    
    res.json(row);
    
    
    });
    
    
    });

app.get("/monthly-profit-loss",(req,res)=>{


        const month=req.query.month;
        
        
        let sql=`
        
        SELECT
        
        a.name,
        
        a.type,
        
        
        SUM(
        
        CASE
        
        WHEN t.credit_account_id=a.id
        
        THEN t.amount
        
        ELSE 0
        
        END
        
        )
        
        -
        
        SUM(
        
        CASE
        
        WHEN t.debit_account_id=a.id
        
        THEN t.amount
        
        ELSE 0
        
        END
        
        )
        
        AS amount
        
        
        FROM accounts a
        
        
        LEFT JOIN transactions t
        
        ON
        
        a.id=t.credit_account_id
        
        OR
        
        a.id=t.debit_account_id
        
        
        WHERE
        
        strftime('%Y-%m',t.transaction_date)=?
        
        
        AND a.type IN
        (
        'Income',
        'Expense'
        )
        
        
        GROUP BY a.id
        
        `;
        
        
        
        db.all(
        
        sql,
        
        [month],
        
        (err,rows)=>{
        
        
        if(err){
        
        return res.status(500)
        .json({
        error:err.message
        });
        
        }
        
        
        res.json(rows);
        
        
        });
        
        
        });
app.listen(3000,()=>{
    console.log("Server started on port 3000");

});