export default async function getData(payload) {
  payload.push("apple");

  return await myAsyncFunction(payload)
    .then((res) => {
      res.push("egg");
      return res;
    })
    .catch((err) => console.error(err));
}

const myAsyncFunction = async (arr) => {
  arr.push("banana");

  const promWait = new Promise((res, rej) => {
    setTimeout(() => someSyncFunction(arr, res), 3000);
  });
  return promWait
    .then((res) => {
      arr.push("donut");
      return arr;
    })
    .catch((err) => {
      console.error(err);
    });
};

const someSyncFunction = (brr, res) => {
  brr.push("cherry");
  res(brr);
};
