// https://www.npmjs.com/package/google-spreadsheet
const { GoogleSpreadsheet } = require("google-spreadsheet");

/** function to return from netlify function with appropriate payload */
function returnFunction(err = null, payload) {
  if (err) {
    console.log("[500] returning error:");
    console.log(err);
    return {
      statusCode: 500,
      body: err.message,
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
  // prepare data
  //const payload = {
  //   playerRecords: this.playerRecords,
  //   sportRecords: this.records,
  //   overview: overview,
  // };
  const payload = JSON.parse(event.body);
  const sports = ["Baseball", "Softball", "Tee-ball"];
  const sportsLC = ["baseball", "softball", "teeball"];
  const summaryValues = {
    Baseball: [
      payload.overview[0].CountMembers,
      payload.overview[0].TotalOutstanding,
      payload.overview[0].CountUnregistered,
    ],
    Softball: [
      payload.overview[1].CountMembers,
      payload.overview[1].TotalOutstanding,
      payload.overview[1].CountUnregistered,
    ],
    "Tee-ball": [
      payload.overview[2].CountMembers,
      payload.overview[2].TotalOutstanding,
      payload.overview[2].CountUnregistered,
    ],
  };
  const summaryCells = ["B3", "B4", "B5"];
  const summaryRange = "B3:B5";

  // column Headings
  const colHeadingsCommon = [
    "name",
    "firstName",
    "lastName",
    "paymentClass",
    "groups",
    "isBaseball",
    "isSoftball",
    "isTeeball",
    "fileIndex",
    "registered",
  ];
  const colHeadingsBaseball = [
    "amountOwedBaseball",
    "amountPaidBaseball",
    "balanceBaseball",
  ];
  const colHeadingsSoftball = [
    "amountOwedSoftball",
    "amountPaidSoftball",
    "balanceSoftball",
  ];
  const colHeadings = (sport = "none") => {
    return [
      ...colHeadingsCommon,
      ...(["Baseball", "Tee-ball", "none"].includes(sport)
        ? colHeadingsBaseball
        : []),
      ...(["Softball", "none"].includes(sport) ? colHeadingsSoftball : []),
    ];
  };
  // first row to write on sport sheets
  const sportHeaderRow = 7;
  const sportFirstRow = sportHeaderRow + 1;
  // overview
  const sheetOverview = doc.sheetsByTitle["Overview"];
  await sheetOverview.addRows(payload.overview);
  const rowCount = sheetOverview.rowCount;
  await sheetOverview.loadCells(`B2:B${rowCount}`);
  for (let i = 2; i <= rowCount; i++) {
    const cell = sheetOverview.getCellByA1(`B${i}`);
    cell.numberFormat = { type: "DATE" };
  }
  await sheetOverview.saveUpdatedCells();

  // 3 sports at once?
  sports.forEach(async (sport, i) => {
    const sheet = doc.sheetsByTitle[sport];
    // write the summary data to the header
    await sheet.loadCells(summaryRange);
    const cells = summaryCells.map((cell) => sheet.getCellByA1(cell));
    cells.forEach((cell, i) => (cell.value = summaryValues[sport][i]));

    // write the row data to the body
    // set the heading row to be not row 1
    console.log("sport: ", sport);
    console.log("colHeadings(sport): ", colHeadings(sport));
    await sheet.setHeaderRow(colHeadings(sport), sportHeaderRow);
    // resize the sheet to remove any data below the heading row
    await sheet.resize({ rowCount: sportHeaderRow, columnCount: 16 });
    // add data
    await sheet.addRows(payload.sportRecords[sportsLC[i]]);
  });

  // baseball
  // const sheetBaseball = doc.sheetsByTitle["Baseball"];

  // await sheetBaseball.loadCells("B3:B5"); // loads a range of cells
  // const a1 = sheet.getCell(0, 0); // access cells using a zero-based index
  // const b2 = sheet.getCellByA1("B2") // or A1 style notation
  // const cells = summaryCells.map((cell) => sheet.getCellByA1(cell));
  // cells.forEach((cell, i) => cell.value === baseballSummary[i]);
  // await sheetBaseball.saveUpdatedCells();
  // access everything about the cell
  // console.log(a1.value);
  // console.log(a1.formula);
  // console.log(a1.formattedValue);
  // update the cell contents and formatting
  // a1.value = 123.456;
  // c6.formula = "=A1";
  // a1.textFormat = { bold: true };
  // c6.note = "This is a note!";
  // await sheet.saveUpdatedCells(); // save all updates in one call

  // const cells = await sheet.loadCells("A1:G4");

  // await sheet.addRow({
  //   Sport: "Dodgeball",
  //   Members: 21,
  //   TotalOwed: 22,
  //   TotalReceived: 23,
  //   TotalOutstanding: 24,
  //   Registered: 25,
  //   RegistrationsOutstanding: 26,
  // });

  // softball
  const sheetSoftball = doc.sheetsByTitle["Softball"];

  // teeball
  const sheetTeeball = doc.sheetsByTitle["Tee-ball"];

  // make a new sheet for this report
  const d = new Date();
  const date = `${d.getFullYear()}${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}`;
  const sheetName = `${date} Report`;
  // console.log("sheetName: ", sheetName);

  // if sheet already exists, delete it
  const oldSheet = doc.sheetsByTitle[sheetName];
  oldSheet && (await oldSheet.delete());

  // create new sheet with title
  const sheet = await doc.addSheet({
    title: sheetName,
    headerValues: colHeadings("all"),
  });

  // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
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
  // console.log("rows: ", Array.isArray(rows));
  // console.log(rows[0]);
  const moreRows = await sheet.addRows(payload.playerRecords);
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
  // const mySheet = {
  //   sheetId: sheet.sheetId,
  //   title: sheet.title,
  //   index: sheet.index,
  // };
  // const myRows = {};
  // const myCells = {};
  const responseObject = { message: "Report generation complete" };

  return returnFunction(null, responseObject);
};
