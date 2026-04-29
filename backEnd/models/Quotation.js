import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema({
  invoiceNo: String,
  date: String,
  eventDate: [
    {
      date: String,
      percentage: { type: Number, default: 100 },
      amount: { type: Number, default: 0 },
    },
  ],
  ClientName: String,
  clientTIN: String,
  clientPosition: String,
  companyName: String,
  clientAddress: String,
  clientTelephoneNumber: String,
  eventLocation: String,
  eventAdditionalInfo: String,
  quotationNo: String,
  invoiceType: { type: String, default: "Tax Invoice" },
  proformaCategory: { type: String, default: "Quotation Type" },
  advanceRequestedAmount: { type: Number },
  advanceRequestedAmountPercent: { type: Number },
  RequestingBalancePayment: { type: Number },
  RequestingBalancePaymentNo: { type: String },

  // Schema එකේ අවසාන හරියට මේවා එකතු කරන්න
  performancecustomDiscount: { type: Number, default: 0 },
  performancecustomDays: { type: Number, default: 1 },
  performancerequestingAmount: { type: Number, default: 100 },
  performanceperDayTotal: { type: Number, default: 0 },

  quotationCategory: {
    type: String,
    default: "Normal",
  },

  editExtraRows: [
    {
      label: String,
      value: Number,
    },
  ],

  // පද්ධති (Systems)
  ledSystems: [
    {
      subTitle: String,
      calculationMethod: String,
      lineItems: [
        {
          desc: String,
          width: Number,
          height: Number,
          cube: Number,
          qty: Number,
          unitPrice: Number,
          sqPrice: Number,
          rowTotal: Number,
        },
      ],
    },
  ],

  lightSystems: [
    {
      subTitle: String,
      lineItems: [
        {
          desc: String,
          qty: Number,
          unitPrice: Number,
          rowTotal: Number,
        },
      ],
    },
  ],

  soundSystems: [
    {
      subTitle: String,
      lineItems: [
        {
          desc: String,
          qty: Number,
          unitPrice: Number,
          rowTotal: Number,
        },
      ],
    },
  ],

  powerSystems: [
    {
      subTitle: String,
      lineItems: [
        {
          desc: String,
          days: Number,
          hours: Number, // අලුතින් එකතු කළා
          qty: Number,
          unitPrice: Number,
          rowTotal: Number,
        },
      ],
    },
  ],

  stageAndTruss: [
    {
      subTitle: String,
      lineItems: [
        {
          desc: String,
          width: Number,
          height: Number,
          qty: Number,
          unitPrice: Number,
          rowTotal: Number,
        },
      ],
    },
  ],
  technicianSystems: [
    {
      subTitle: String,
      lineItems: [
        {
          desc: String,
          days: Number,
          distance: Number,
          qty: Number,
          unitPrice: Number,
          rowTotal: Number,
        },
      ],
    },
  ],
  videoSystems: [
    {
      subTitle: String,
      lineItems: [
        {
          desc: String,
          qty: Number,
          unitPrice: Number,
          rowTotal: Number,
        },
      ],
    },
  ],

  otherSystems: [
    {
      subTitle: String,
      lineItems: [
        {
          desc: String,
          qty: Number,
          unitPrice: Number,
          rowTotal: Number,
        },
      ],
    },
  ],

  // මුළු ගණන් (Totals)
  discount: { type: Number, default: 0 },
  subTotal: Number,
  totalValueOfSupply: Number, // අලුතින් එකතු කළා (Discount අඩු කළ පසු අගය)
  vat: Number,
  grandTotal: Number,

  totalLEDLightingSoundStageTruss: Number, // 1+2+3+5 එකතුව
  totalPowerGenerator: Number, // 4 එකතුව
  totalVideoAnimation: Number, // 6 එකතුව
  totalTechnicianTransport: Number, // 7 එකතුව
  totalOtherServices: Number,
  discountButtonYes: Number,
  multiDays: Number,
  discountTotalLEDLightingSoundStageTruss: { type: Number, default: 0 },
  discountTotalLEDLightingSoundStageTrussPercent: { type: Number, default: 0 },

  eventDays: Number,
  rehearsalDay: String,
  rehearsalDiscountPercent: Number,
  rehearsalAmount: Number,
  summaryDetails: [
    {
      categoryId: String,
      categoryTitle: String,
      baseTotal: Number,
      row: [
        {
          rowType: String,
          discountRs: Number,
          discountPercent: Number,
          amount: Number,
        },
      ],
      categoryFinalTotal: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Quotation = mongoose.model("Quotation", quotationSchema);
export default Quotation;
