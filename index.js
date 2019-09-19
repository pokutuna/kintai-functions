const puppeteer = require("puppeteer");
const Ajv = require("ajv");

const execKintai = async param => {
  const browser = await puppeteer.launch({
    // https://github.com/GoogleChrome/puppeteer/issues/3120
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-first-run",
      "--no-sandbox",
      "--no-zygote",
      "--single-process"
    ]
  });

  const page = await browser.newPage();
  await page.goto(`https://e5.nds-tyo.co.jp/${param.company}.HTML`);

  const frame = page.frames().find(f => /CGI-BIN/.test(f.url()));

  await frame.type('input[type="text"]', param.employee);
  await frame.type('input[type="password"]', param.password);

  const buttonName = param.action === "in" ? "start_btn" : "end_btn";
  await frame.click(`input[name="${buttonName}"]`);

  const message = await frame
    .waitForSelector("select")
    .then(h => h.evaluate(n => n.innerText));

  await browser.close();

  return message.trim();
};

const kintaiSchema = {
  type: "object",
  properties: {
    company: { type: "string" },
    employee: { type: "string" },
    password: { type: "string" },
    action: {
      type: "string",
      enum: ["in", "out"]
    }
  },
  required: ["company", "employee", "password", "action"]
};

exports.kintai = (req, res) => {
  const ajv = new Ajv();
  const isBodyValid = ajv.validate(kintaiSchema, req.body);
  if (!isBodyValid) {
    return res.status(400).send({ errors: ajv.errors });
  }

  execKintai(req.body)
    .then(msg => res.status(200).send({ message: msg }))
    .catch(err => {
      console.error(err);
      res.status(400).send({ errros: err });
    });
};
