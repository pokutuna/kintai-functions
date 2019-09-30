const puppeteer = require("puppeteer");
const Ajv = require("ajv");

const actionToButtonName = action => {
  if (action === "in") return "start_btn";
  if (action === "out") return "end_btn";

  const hour = new Date().getHours();
  return 6 <= hour && hour < 15 ? "start_btn" : "end_btn";
};

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

  const buttonName = actionToButtonName(param.action)
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
      enum: ["in", "out", "auto"]
    }
  },
  required: ["company", "employee", "password", "action"]
};

exports.kintai = (req, res) => {
  const ajv = new Ajv();
  const isBodyValid = ajv.validate(kintaiSchema, req.body);
  if (!isBodyValid) {
    return res.status(400).json({ errors: ajv.errors });
  }

  execKintai(req.body)
    .then(msg => res.status(200).json({ message: msg }))
    .catch(err => {
      console.error(err);
      res.status(400).json({ errros: err });
    });
};
