import app from "./app";
import config from "./config";

const main = () => {
  const port = config.port;

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

main();
