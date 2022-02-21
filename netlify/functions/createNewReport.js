// https://www.npmjs.com/package/google-spreadsheet
const { GoogleSpreadsheet } = require("google-spreadsheet");

/** function to return from netlify function with appropriate payload */
function returnFunction(err = null, payload) {
  if (err) {
    console.log("[500] returning error:");
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err,
      }),
    };
  }
  console.log("[200] Returning payload:");
  console.log(JSON.stringify(payload));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: payload,
    }),
  };
}

exports.handler = async (event, context, callback) => {
  // console.log("event: ", event);
  // console.log("context: ", context);
  // console.log("payload: ", payload);
  // select the WBC Report ssheet
  // const test = callback();
  // console.log("test: ", test);
  const doc = new GoogleSpreadsheet(
    "1-Dv7yxqmUi9XSfHylF0IChUyRIMiGUEcwjY2NqN20h4"
  );
  // authenticate
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  });

  await doc.loadInfo(); // loads document properties and worksheets

  // make a new sheet for this report
  const d = new Date();
  const date = `${d.getFullYear()}${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}`;
  const sheetName = `${date} Report`;
  console.log("sheetName: ", sheetName);

  // if sheet already exists, delete it
  const oldSheet = doc.sheetsByTitle[sheetName];
  oldSheet && (await oldSheet.delete());

  // column Headings
  const colHeadings = [
    "name",
    "firstName",
    "lastName",
    "paymentClass",
    "groups",
    "isBaseball",
    "isSoftball",
    "isTeeball",
    "fileIndex",
    "amountOwedBaseball",
    "amountOwedSoftball",
    "amountPaidBaseball",
    "amountPaidSoftball",
    "balanceBaseball",
    "balanceSoftball",
    "registered",
  ];
  // create new sheet with title
  const sheet = await doc.addSheet({
    title: sheetName,
    headerValues: colHeadings,
  });

  // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
  const mySheet = {
    sheetId: sheet.sheetId,
    title: sheet.title,
    index: sheet.index,
  };
  // read rows
  // const rows = await sheet.getRows(); // can pass in { limit, offset }
  // const myRows = rows.map((row) => {
  //   const returnObj = {};
  //   colHeadings.forEach((heading) => {
  //     console.log("heading: ", heading);
  //     console.log("row[heading]: ", row[heading]);
  //     Object.assign(returnObj, { [heading]: row[heading] });
  //     console.log("returnObj: ", returnObj);
  //   });
  //   return returnObj;
  // });
  // console.log("myRows: ", myRows);
  const rows = JSON.parse(event.body);
  console.log("rows: ", Array.isArray(rows));
  console.log(rows[0]);
  const moreRows = await sheet.addRows(rows);
  // add Row
  // await sheet.addRow({
  //   Sport: "Dodgeball",
  //   Members: 21,
  //   TotalOwed: 22,
  //   TotalReceived: 23,
  //   TotalOutstanding: 24,
  //   Registered: 25,
  //   RegistrationsOutstanding: 26,
  // });

  // const cells = await sheet.loadCells("A1:G4");
  // // console.log("rows: ", rows);
  // console.log("cells: ", cells);
  // console.log("cell stats: ", sheet.cellStats);
  // const myCells = { cells, stats: sheet.cellStats };
  const myRows = {};
  const myCells = {};
  const responseObject = { mySheet, myRows, myCells };

  return returnFunction(null, responseObject);
};
