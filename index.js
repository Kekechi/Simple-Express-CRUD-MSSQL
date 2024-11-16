import express from "express";
import { Connection, Request } from "tedious";
import "dotenv/config";

const config = JSON.parse(process.env.DB_CONFIG);

const app = express();
const port = 3000;
const connection = new Connection(config);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/todo/create", (req, res) => {
  const body = req.body;
  const request = new Request(
    `INSERT INTO dbo.todo VALUES ('${body.name}','INCOMP')`,
    (err, rowCount) => {
      if (err) {
        console.error(err.message);
        res.status(500).send("Error");
      } else {
        console.log(`${rowCount} row(s) inserted`);
        res.send("Inserted");
      }
    }
  );

  connection.execSql(request);
});

app.post("/todo/:id/update", (req, res) => {
  const id = req.params.id;
  const body = req.body;

  const queryString = (() => {
    if (body.name && body.status) {
      return `name = '${body.name}', status = '${body.status}'`;
    } else if (body.name) {
      return `name = '${body.name}'`;
    } else if (body.status) {
      return `status = '${body.status}'`;
    } else {
      res.status(400).send("Bad Request");
      return null;
    }
  })();

  if (!queryString) return;

  const request = new Request(
    `UPDATE dbo.todo SET ${queryString} WHERE id = ${id}`,
    (err, rowCount) => {
      if (err) {
        console.error(err.message);
        res.status(500).send("Error");
      } else {
        console.log(`${rowCount} row(s) updated`);
        res.send("Updated");
      }
    }
  );

  connection.execSql(request);
});

app.get("/todo/all", (req, res) => {
  const request = new Request("SELECT * FROM dbo.todo", (err, rowCount) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`${rowCount} row(s) returned`);
    }
  });

  const result = [];

  request.on("row", (columns) => {
    const row = {};
    columns.forEach((column) => {
      row[column.metadata.colName] = column.value;
      console.log("%s\t%s", column.metadata.colName, column.value);
    });
    result.push(row);
  });

  request.on("requestCompleted", () => {
    res.send(result);
  });

  connection.execSql(request);
});

app.get("/todo/:id", (req, res) => {
  const id = req.params.id;
  const request = new Request(
    `SELECT * FROM dbo.todo WHERE id = ${id}`,
    (err, rowCount) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log(`${rowCount} row(s) returned`);
      }
    }
  );

  let result = {};
  request.on("row", (columns) => {
    columns.forEach((column) => {
      result[column.metadata.colName] = column.value;
      console.log("%s\t%s", column.metadata.colName, column.value);
    });
  });

  request.on("requestCompleted", () => {
    res.send(result);
  });

  connection.execSql(request);
});
~app.delete("/todo", (req, res) => {
  const id = req.body.id;
  const request = new Request(
    `DELETE FROM dbo.todo WHERE id = ${id}`,
    (err, rowCount) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log(`${rowCount} row(s) deleted`);
      }
    }
  );

  request.on("requestCompleted", () => {
    res.send("Deleted");
  });

  connection.execSql(request);
});

connection.on("connect", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the database");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
});

connection.connect();
