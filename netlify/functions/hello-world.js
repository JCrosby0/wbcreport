exports.handler = async (event) => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Hello World!",
      }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: e.message,
      }),
    };
  }
};
