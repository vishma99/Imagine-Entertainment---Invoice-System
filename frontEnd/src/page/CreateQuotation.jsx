import React, { useState, useEffect } from "react";

import axios from "axios";

import "../css/createQuatation.css";
import ShowSuccessModalDiscount from "../components/ShowSuccessModalDiscount";
import ShowSuccessModal from "../components/ShowSuccessModal";

const numberToWords = (num) => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if ((num = num.toString()).length > 9) return "Amount too large";
  let n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";
  let str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred "
      : "";
  str +=
    n[5] != 0
      ? (str != "" ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]])
      : "";
  return str.trim() + " Rupees Only";
};
const InvoiceForm = () => {
  const [invoice, setInvoice] = useState({
    invoiceNo: "T-",

    date: "",

    eventDate: [""],

    ClientName: "",

    clientTIN: "",

    clientPosition: "", // Designation

    companyName: "",

    clientAddress: "",

    clientTelephoneNumber: "",

    eventLocation: "",

    eventAdditionalInfo: "",
    discount: 0,
    discountPercent: 0,
    technicianDistance: "",
    discountLED: 0,
    discountLEDPercent: 0,

    ledSystems: [],

    lightSystems: [],

    soundSystems: [],

    powerSystems: [],

    stageAndTruss: [
      { subTitle: "Truss System (Normal)", lineItems: [] },
      { subTitle: "Truss System (Goalpost Truss)", lineItems: [] },
      { subTitle: "Truss System (Marquee)", lineItems: [] },
      { subTitle: "Stage System (Main stage)", lineItems: [] },
      { subTitle: "Stage System (Platform)", lineItems: [] },
    ],

    videoSystems: [],

    technicianSystems: [],

    otherSystems: [],
  });

  const addEventDate = () => {
    setInvoice({ ...invoice, eventDate: [...invoice.eventDate, ""] });
  };

  const removeEventDate = (index) => {
    const updatedDates = invoice.eventDate.filter((_, i) => i !== index);
    setInvoice({ ...invoice, eventDate: updatedDates });
  };

  const handleEventDateChange = (index, value) => {
    const updatedDates = [...invoice.eventDate];
    updatedDates[index] = value;
    setInvoice({ ...invoice, eventDate: updatedDates });
  };
  const [priceList, setPriceList] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("https://imagine-entertainment-invoice-system.onrender.com/api/items");

        setPriceList(res.data);
      } catch (err) {
        console.error("Error loading price list", err);
      }
    };

    fetchItems();
  }, []);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isMoreThanDays, setIsMoreThanDays] = useState(false);
  const [specialNote, setSpecialNote] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  // එක් එක් දවසේ අගයන් (Price) තබා ගැනීමට
  const [summaryDayValues, setSummaryDayValues] = useState({});
  const [isRehearsal, setIsRehearsal] = useState("No");

  const [quotationType, setQuotationType] = useState("Normal Quotation");
  const [showTypeSelection, setShowTypeSelection] = useState(false);

  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [finalView, setFinalView] = useState(null);
  const [finalViewYes, setFinalViewYes] = useState(null);
  const [discountSelection, setDiscountSelection] = useState("");
  const isMultiDay =
    invoice.rehearsalDay ||
    invoice.eventDate.filter((d) => d !== "").length > 1;

  const [rehearsalDiscountPercent, setRehearsalDiscountPercent] = useState(50); // Default 50%
  const [rehearsalAmount, setRehearsalAmount] = useState(0);
  const [eventDayCustomValues, setEventDayCustomValues] = useState({});
  // const [rehearsalAmount, setRehearsalAmount] = useState(subTotalLEDGroup * 0.5);
  const handleShowSummary = () => {
    const ledT =
      calculateCategoryTotal(invoice.ledSystems) +
      calculateCategoryTotal(invoice.lightSystems) +
      calculateCategoryTotal(invoice.soundSystems) +
      calculateCategoryTotal(invoice.stageAndTruss);
    const powerT = calculateCategoryTotal(invoice.powerSystems);
    const videoT = calculateCategoryTotal(invoice.videoSystems);
    const techT = calculateCategoryTotal(invoice.technicianSystems);
    const otherT = calculateCategoryTotal(invoice.otherSystems);

    const ledNet =
      ledT - (Number(invoice.discountTotalLEDLightingSoundStageTruss) || 0);

    const baseTotals = {
      led: ledNet,
      power: powerT,
      video: videoT,
      tech: techT,
      other: otherT,
    };
    let initialValues = {};

    ["led", "power", "video", "tech", "other"].forEach((id) => {
      const total = baseTotals[id];

      // Rehearsal සඳහා default values (100% සහ සම්පූර්ණ මුදල)
      if (isRehearsal === "Yes") {
        initialValues[`${id}_rehearsal_discount_percent`] = "100";
        initialValues[`${id}_rehearsal_discount_rs`] = total.toFixed(2);
        initialValues[`${id}_rehearsal_amount`] = total.toFixed(2);
      }

      // සෑම දවසක් සඳහාම default values (100% සහ සම්පූර්ණ මුදල)
      for (let i = 0; i < (Number(specialNote) || 0); i++) {
        initialValues[`${id}_${i}_discount_percent`] = "100";
        initialValues[`${id}_${i}_discount_rs`] = total.toFixed(2);
        initialValues[`${id}_${i}_amount`] = total.toFixed(2);
      }
    });

    setSummaryDayValues(initialValues);
    setShowSummary(true);
  };

  const handleSummaryPriceChange = (
    tableId,
    dayIndex,
    field,
    value,
    baseAmount,
  ) => {
    const numValue = parseFloat(value) || 0;

    setSummaryDayValues((prev) => {
      const newState = { ...prev };
      const keyBase = `${tableId}_${dayIndex}`;

      if (field === "rs") {
        const percent = baseAmount > 0 ? (numValue / baseAmount) * 100 : 0;
        newState[`${keyBase}_discount_rs`] = value;
        newState[`${keyBase}_discount_percent`] = percent.toFixed(2);
        newState[`${keyBase}_amount`] = numValue.toFixed(2);
      } else if (field === "percent") {
        const calculatedAmount = (baseAmount * numValue) / 100;
        newState[`${keyBase}_discount_percent`] = value;
        newState[`${keyBase}_discount_rs`] = calculatedAmount.toFixed(2);
        newState[`${keyBase}_amount`] = calculatedAmount.toFixed(2);
      }

      return newState;
    });
  };

  // --- Functions ---

  const addSubCategory = (mainCatKey) => {
    const newSub = {
      subTitle: "New Sub-category",
      calculationMethod: "unit", // මුළු Block එකටම අදාළ default method එක
      lineItems: [{ desc: "", width: 0, height: 0, qty: 1, unitPrice: 0 }],
      isNew: true,
    };
    const updatedMain = [...invoice[mainCatKey], newSub];
    setInvoice({ ...invoice, [mainCatKey]: updatedMain });

    const newIdx = updatedMain.length - 1;
    setTimeout(() => {
      const el = document.getElementById(`${mainCatKey}-${newIdx}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };
  // --- අලුතින් එක් කළ යුතු කොටස ---
  const deleteSubCategory = (mainCatKey, subIdx) => {
    // අදාළ Category එකේ අරාව (Array) ලබා ගන්න
    const updatedMain = [...invoice[mainCatKey]];

    // index එක අනුව අදාළ block එක ඉවත් කරන්න
    updatedMain.splice(subIdx, 1);

    // State එක update කරන්න
    setInvoice({ ...invoice, [mainCatKey]: updatedMain });
  };

  const deleteLineItem = (mainCatKey, subIdx, itemIdx) => {
    const updatedMain = [...invoice[mainCatKey]];
    updatedMain[subIdx].lineItems.splice(itemIdx, 1);
    setInvoice({ ...invoice, [mainCatKey]: updatedMain });
  };
  const handleSubMethodChange = (mainCatKey, subIdx, value) => {
    const updatedMain = [...invoice[mainCatKey]];
    updatedMain[subIdx].calculationMethod = value;

    // Method එක මාරු කරන විට එම Block එකේ සියලුම පේළි වල අගයන් reset කිරීම (විකල්පයි නමුත් හොඳයි)
    updatedMain[subIdx].lineItems.forEach((item) => {
      if (value === "unit") {
        item.width = 0;
        item.height = 0;
        item.cube = 0;
      } else {
        item.qty = 1;
      }
    });

    setInvoice({ ...invoice, [mainCatKey]: updatedMain });
  };

  const addLineItem = (mainCatKey, subIdx) => {
    const newItem = { desc: "", width: 0, height: 0, qty: 1, unitPrice: 0 };

    const updatedMain = [...invoice[mainCatKey]];

    updatedMain[subIdx].lineItems.push(newItem);

    setInvoice({ ...invoice, [mainCatKey]: updatedMain });
  };

  const handleLineItemChange = (mainCatKey, subIdx, itemIdx, field, value) => {
    const updatedMain = [...invoice[mainCatKey]];
    const subBlock = updatedMain[subIdx];
    const currentItem = subBlock.lineItems[itemIdx];

    if (
      field === "width" ||
      field === "height" ||
      field === "cube" ||
      field === "qty" ||
      field === "unitPrice" ||
      field === "sqPrice" ||
      field === "distance" ||
      field === "days" ||
      field === "hours"
    ) {
      currentItem[field] = Number(value);
    } else {
      currentItem[field] = value;
    }

    // 1. මිල සහ දුර (Distance) Database එකෙන් ලබා ගැනීම
    if (field === "desc") {
      const selectedProduct = priceList.find((p) => p.name === value);
      if (selectedProduct) {
        currentItem.unitPrice = selectedProduct.price || 0;
        currentItem.sqPrice = selectedProduct.sqPrice || 0;

        // --- Technician & Transport සඳහා Distance එක Database එකෙන් ලබා ගැනීම ---
        if (mainCatKey === "technicianSystems") {
          // Database එකේ distance කියලා field එකක් ඇති කියලා මම හිතනවා
          currentItem.distance = selectedProduct.distance || 0;
        }
      }
    }

    // 2. ගණනය කිරීම් (Calculations)
    if (mainCatKey === "ledSystems") {
      // Database එකට යන field එක 'square' නිසා ඒකම පාවිච්චි කරන්න
      const cube = currentItem.cube || 0;
      const qty = currentItem.qty || 0;
      const w = currentItem.width || 0;
      const h = currentItem.height || 0;

      if (subBlock.calculationMethod === "unit") {
        // Cube * Qty * UnitPrice
        currentItem.rowTotal = cube * qty * (currentItem.unitPrice || 0);
      } else if (subBlock.calculationMethod === "square") {
        // Width * Height * Qty * SqPrice
        currentItem.rowTotal = w * h * qty * (currentItem.sqPrice || 0);
      }
    } else if (mainCatKey === "stageAndTruss") {
      const h = currentItem.height || 1;
      const w = currentItem.width || 1;
      const q = currentItem.qty || 0;
      const up = currentItem.unitPrice || 0;

      if (subBlock.subTitle.includes("Marquee")) {
        currentItem.rowTotal = q * up;
      } else if (
        subBlock.subTitle.includes("Goalpost Truss") ||
        subBlock.subTitle.includes("Main stage") ||
        subBlock.subTitle.includes("Platform")
      ) {
        currentItem.rowTotal = h * w * q * up;
      } else if (subBlock.subTitle.includes("Normal")) {
        currentItem.rowTotal = w * q * up;
      }
    } else if (mainCatKey === "powerSystems") {
      const hours = Number(currentItem.hours) || 8;
      const days = Number(currentItem.days) || 1;
      currentItem.rowTotal =
        ((currentItem.unitPrice || 0) / 8) *
        hours *
        (currentItem.qty || 1) *
        days;
    }
    // --- Technician & Transport ගණනය කිරීම ---
    else if (mainCatKey === "technicianSystems") {
      const dist = Number(currentItem.distance) || 0;
      const days = Number(currentItem.days) || 1;
      const qty = Number(currentItem.qty) || 0;
      const unitPrice = Number(currentItem.unitPrice) || 0;

      // Formula: Unit Price * Qty * Days * Distance
      currentItem.rowTotal = unitPrice * qty * days * dist;
    } else {
      currentItem.rowTotal =
        (currentItem.unitPrice || 0) * (currentItem.qty || 0);
    }

    setInvoice({ ...invoice, [mainCatKey]: updatedMain });
  };

  const handleSubTitleChange = (mainCatKey, subIdx, value) => {
    const updatedMain = [...invoice[mainCatKey]];

    updatedMain[subIdx].subTitle = value;

    setInvoice({ ...invoice, [mainCatKey]: updatedMain });
  };

  const calculateCategoryTotal = (items) => {
    return items.reduce((sum, sub) => {
      const subSum = sub.lineItems.reduce(
        (s, item) => s + (item.rowTotal || 0),

        0,
      );

      return sum + subSum;
    }, 0);
  };

  const calculateGrandTotal = () => {
    let total = 0;

    const categories = [
      "ledSystems",

      "lightSystems",

      "soundSystems",

      "powerSystems",

      "stageAndTruss",

      "videoSystems",

      "technicianSystems",

      "otherSystems",
    ];

    categories.forEach((cat) => {
      total += calculateCategoryTotal(invoice[cat]);
    });

    return total;
  };

  const handleSaveQuotation = async () => {
    // 1. Event දින ගණන ගණනය කිරීම
    setShowSaveModal(false);
    saveToDatabase();
  };

  // Database එකට Save කිරීමේ පොදු function එක (කේතය පිරිසිදුව තබා ගැනීමට)
  const saveToDatabase = async (noteValue = "") => {
    // const isNormalQuotation =
    //   !showSummary && !isMoreThanDays && (Number(specialNote) || 0) <= 0;
    const eventDaysCount = invoice.eventDate.filter((d) => d !== "").length;
    const hasRehearsal = invoice.rehearsalDay && invoice.rehearsalDay !== "";

    const ismultiDaysQuotation = eventDaysCount > 1 || hasRehearsal;
    const ledT = calculateCategoryTotal(invoice.ledSystems);
    const lightT = calculateCategoryTotal(invoice.lightSystems);
    const soundT = calculateCategoryTotal(invoice.soundSystems);
    const stageT = calculateCategoryTotal(invoice.stageAndTruss);

    const powerT = calculateCategoryTotal(invoice.powerSystems);
    const videoT = calculateCategoryTotal(invoice.videoSystems);
    const techT = calculateCategoryTotal(invoice.technicianSystems);
    const otherT = calculateCategoryTotal(invoice.otherSystems);

    // LED කාණ්ඩයේ සම්පූර්ණ එකතුව (Discount කිරීමට පෙර)
    const totalLEDGroupBeforeDiscount = ledT + lightT + soundT + stageT;

    // --- වැදගත්: LED කාණ්ඩයේ Discount එක ලබා ගැනීම ---
    const ledGroupDiscountAmount =
      Number(invoice.discountLED) ||
      Number(invoice.discountTotalLEDLightingSoundStageTruss) ||
      0;
    const ledGroupDiscountPercent =
      Number(invoice.discountLEDPercent) ||
      Number(invoice.discountTotalLEDLightingSoundStageTrussPercent) ||
      0;

    // LED කාණ්ඩයේ ශුද්ධ එකතුව
    const netLEDGroup = totalLEDGroupBeforeDiscount - ledGroupDiscountAmount;

    // අනෙකුත් සියලු කාණ්ඩවල එකතුව
    const otherCategoriesTotal = powerT + videoT + techT + otherT;

    // 2. මුළු Sub Total එක ගණනය කිරීම
    let finalSubTotal = 0;
    let summaryDetails = [];

    if (showSummary || isMoreThanDays || Number(specialNote) > 0) {
      // --- Multi-day Logic (මෙය ඔබේ පවතින logic එකම වේ) ---
      let summarySubTotal = 0;
      const categories = [
        { id: "led", base: netLEDGroup },
        { id: "power", base: powerT },
        { id: "video", base: videoT },
        { id: "tech", base: techT },
        { id: "other", base: otherT },
      ];

      summaryDetails = categories.map((cat) => {
        let categoryFinalTotal = 0;
        let row = [];
        if (isRehearsal === "Yes") {
          const amt =
            parseFloat(summaryDayValues[`${cat.id}_rehearsal_amount`]) || 0;
          row.push({ rowType: "Rehearsal", amount: amt });
          categoryFinalTotal += amt;
        }
        for (let i = 0; i < (Number(specialNote) || 0); i++) {
          const amt =
            parseFloat(summaryDayValues[`${cat.id}_${i}_amount`]) || 0;
          row.push({ rowType: `Day ${i + 1}`, amount: amt });
          categoryFinalTotal += amt;
        }
        summarySubTotal += categoryFinalTotal;
        return {
          categoryId: cat.id,
          row: row,
          categoryFinalTotal: categoryFinalTotal,
        };
      });
      finalSubTotal = summarySubTotal;
    }

    // --- 3. "Normal Quotation" Logic ---
    else {
      // LED Group එකේ Discount අඩු කළ අගය + අනෙක් ඒවයේ එකතුව
      finalSubTotal = netLEDGroup + otherCategoriesTotal;
    }

    // --- 4. අවසාන ගණනය කිරීම් (Tax & Grand Total) ---
    const finalOverallDiscount = Number(invoice.discount) || 0;
    const finalOverallDiscountPercent = Number(invoice.discountPercent) || 0;

    // 4. අවසාන ගෙවිය යුතු මුදල සහ VAT
    const totalValueOfSupply = finalSubTotal - finalOverallDiscount;
    const finalVat = totalValueOfSupply * 0.18;
    const finalGrandTotal = totalValueOfSupply + finalVat;

    const formattedEventDates = invoice.eventDate
      .map((date, idx) => {
        if (!date) return null;
        return {
          date: date,
          // ඔයා UI එකේ වෙනස් කරන අගය ගන්නවා, නැත්නම් default 100% / full amount ගන්නවා
          percentage: Number(eventDayCustomValues[`day_${idx}_pct`] ?? 100),
          amount: Number(
            eventDayCustomValues[`day_${idx}_amt`] ?? subTotalLEDGroup,
          ),
        };
      })
      .filter((item) => item !== null);

    // --- 5. Database එකට යවන දත්ත සැකසීම ---
    const finalData = {
      ...invoice,
      eventDate: formattedEventDates,
      summaryDetails,

      // පද්ධති වල මුළු අගයන් (Totals for Database)
      // 🟢 LED Group එකට අදාළ වට්ටම මෙතනට සේව් වේ
      discountTotalLEDLightingSoundStageTruss: Number(
        ledGroupDiscountAmount.toFixed(2),
      ),
      discountTotalLEDLightingSoundStageTrussPercent: Number(
        ledGroupDiscountPercent,
      ),
      totalLEDLightingSoundStageTruss: totalLEDGroupBeforeDiscount,

      // 🟢 මුළු Quotation එකටම අදාළ වට්ටම (Overall Discount) මෙතනට සේව් වේ
      discount: Number(finalOverallDiscount.toFixed(2)),
      discountPercent: Number(finalOverallDiscountPercent),

      // අනෙකුත් ප්‍රධාන අගයන්
      subTotal: Number(finalSubTotal.toFixed(2)),
      totalValueOfSupply: Number(totalValueOfSupply.toFixed(2)),
      vat: Number(finalVat.toFixed(2)),
      grandTotal: Number(finalGrandTotal.toFixed(2)),

      quotationCategory: quotationType,
      specialNote: noteValue,
      eventDays:
        isMoreThanDays || showSummary
          ? Number(specialNote) || 0
          : invoice.eventDate.length,
      rehearsalDay: invoice.rehearsalDay || "",
      rehearsalDiscountPercent: Number(rehearsalDiscountPercent),
      rehearsalAmount: Number(rehearsalAmount.toFixed(2)),

      discountButtonYes:
        // !isNormalQuotation || discountSelection === "Yes" ? 1 : 0,
        discountSelection === "Yes" ? 1 : 0,

      multiDays: ismultiDaysQuotation ? 1 : 0,
    };

    // --- 6. Axios හරහා API එකට යැවීම ---
    try {
      const response = await axios.post(
        "https://imagine-entertainment-invoice-system.onrender.com/api/quotations",
        finalData,
      );
      if (response.status === 201) {
        alert("✅ Quotation save successfully!");
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Save Error:", err);
      alert("❌ Save ");
    }
  };

  const renderStageTrussSection = (
    title,
    subCats,
    mainCatKey,
    prefix,
    colorClass,
  ) => {
    const categoryTotal = calculateCategoryTotal(subCats);
    let globalItemIndex = 0;

    return (
      <div className={`main-category-section ${colorClass}`} key={mainCatKey}>
        <h3 className="main-cat-title">
          {prefix}. {title}
        </h3>

        {/* බොත්තම් පෙළ (Buttons Row) */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "10px",
            flexWrap: "wrap",
          }}
        >
          {subCats.map((sub, subIdx) => (
            <button
              key={subIdx}
              className="btn-add-line"
              style={{ backgroundColor: "#2196F3", color: "white" }}
              onClick={() => addLineItem(mainCatKey, subIdx)}
            >
              + Add {sub.subTitle}
            </button>
          ))}
        </div>

        {subCats.map((sub, subIdx) => {
          // පේළි තිබේ නම් පමණක් Table එක පෙන්වයි
          if (sub.lineItems.length === 0) return null;

          return (
            <div
              key={subIdx}
              className="sub-category-block"
              style={{ marginTop: "10px" }}
            >
              <div
                className="sub-cat-header"
                style={{ backgroundColor: "#e3f2fd", padding: "5px 10px" }}
              >
                <h4 style={{ margin: 0, fontSize: "14px" }}>{sub.subTitle}</h4>
              </div>

              <div className="items-table-container">
                <div className="table-header">
                  <div className="col-ref">NO</div>
                  <div className="col-desc">Description</div>

                  {/* 1. Height පෙන්වන අවස්ථා (Goalpost, Main stage, Platform) */}
                  {(sub.subTitle.includes("Goalpost Truss") ||
                    sub.subTitle.includes("Main stage") ||
                    sub.subTitle.includes("Platform")) && (
                    <div className="col-height" style={{ width: "60px" }}>
                      Height
                    </div>
                  )}

                  {/* 2. Width පෙන්වන අවස්ථා (Marquee හැර අනෙක් සියල්ල) */}
                  {!sub.subTitle.includes("Marquee") && (
                    <div className="col-width">Width (ft)</div>
                  )}

                  <div className="col-qty">QTY</div>
                  <div className="col-price">UNIT PRICE</div>
                  <div className="col-total">TOTAL</div>
                  <div className="col-action" style={{ width: "30px" }}></div>
                </div>

                {sub.lineItems.map((item, itemIdx) => {
                  globalItemIndex++;
                  return (
                    <div className="item-row" key={itemIdx}>
                      <div className="col-ref">
                        {prefix}.{globalItemIndex}
                      </div>
                      <div className="col-desc">
                        <input
                          list={`price-list-${mainCatKey}-${subIdx}-${itemIdx}`}
                          className="desc-select"
                          value={item.desc}
                          placeholder="Type to search..."
                          onChange={(e) =>
                            handleLineItemChange(
                              mainCatKey,
                              subIdx,
                              itemIdx,
                              "desc",
                              e.target.value,
                            )
                          }
                        />
                        <datalist
                          id={`price-list-${mainCatKey}-${subIdx}-${itemIdx}`}
                        >
                          {priceList
                            .filter((p) => {
                              // 1. Category එක match වෙනවද බලන්න
                              const isMainCatMatch = p.category === mainCatKey;

                              // 2. Database එකේ SubCategory field එක අකුරු ලොකු/කුඩා දෙකෙන්ම තිබිය හැක
                              // ඒ නිසා p.SubCategory හෝ p.subcategory දෙකම පරීක්ෂා කරමු
                              const dbSub =
                                p.SubCategory || p.subCategory || "";

                              // 3. UI එකේ Title එක ඇතුළේ ඒ SubCategory එක තියෙනවද බලන්න
                              const isSubCatMatch =
                                dbSub &&
                                sub.subTitle
                                  .toLowerCase()
                                  .includes(dbSub.toLowerCase());

                              return isMainCatMatch && isSubCatMatch;
                            })
                            .map((p) => (
                              <option key={p._id} value={p.name} />
                            ))}
                        </datalist>
                      </div>

                      {/* Height Input (Goalpost, Main stage, Platform සඳහා පමණි) */}
                      {(sub.subTitle.includes("Goalpost Truss") ||
                        sub.subTitle.includes("Main stage") ||
                        sub.subTitle.includes("Platform")) && (
                        <div className="col-height">
                          <input
                            type="number"
                            value={item.height || ""}
                            onChange={(e) =>
                              handleLineItemChange(
                                mainCatKey,
                                subIdx,
                                itemIdx,
                                "height",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                      )}

                      {/* Width Input (Marquee හැර අනෙක් සියල්ලට) */}
                      {!sub.subTitle.includes("Marquee") && (
                        <div className="col-width">
                          <input
                            type="number"
                            value={item.width || ""}
                            onChange={(e) =>
                              handleLineItemChange(
                                mainCatKey,
                                subIdx,
                                itemIdx,
                                "width",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                      )}

                      <div className="col-qty">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            handleLineItemChange(
                              mainCatKey,
                              subIdx,
                              itemIdx,
                              "qty",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>

                      <div className="col-price">
                        <input
                          type="number"
                          value={item.unitPrice || 0}
                          onChange={(e) =>
                            handleLineItemChange(
                              mainCatKey,
                              subIdx,
                              itemIdx,
                              "unitPrice",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="col-total">
                        {(item.rowTotal || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="col-action">
                        <button
                          className="btn-delete-line"
                          onClick={() =>
                            deleteLineItem(mainCatKey, subIdx, itemIdx)
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button
                  className="btn-add-line"
                  onClick={() => addLineItem(mainCatKey, subIdx)}
                  style={{ marginTop: "10px" }}
                >
                  + Add {sub.subTitle} Item
                </button>
              </div>
            </div>
          );
        })}

        <div className="category-footer">
          Total for {title}: Rs. {categoryTotal.toLocaleString()}
        </div>
      </div>
    );
  };
  const renderMainSection = (
    title,
    subCats,
    mainCatKey,
    prefix,
    colorClass,
  ) => {
    const categoryTotal = calculateCategoryTotal(subCats);

    // විශේෂ කොටස් හඳුනා ගැනීම
    const isTechnicianSection = mainCatKey === "technicianSystems";
    const ispowerSection = mainCatKey === "powerSystems";
    const isVideoSection = mainCatKey === "videoSystems";
    const isOtherSection = mainCatKey === "otherSystems";

    // "Add Sub-Category" බොත්තම අවශ්‍ය නැති අංශ (Technician දැන් මෙයට ඇතුළත් වේ)
    const isSimpleSection =
      isTechnicianSection || isVideoSection || isOtherSection || ispowerSection;

    // මෙය render function එක ඇතුළත ලියන්න
    const refreshTotals = () => {
      const l_T = calculateCategoryTotal(invoice.ledSystems);
      const li_T = calculateCategoryTotal(invoice.lightSystems);
      const s_l_T = calculateCategoryTotal(invoice.soundSystems);
      const st_T = calculateCategoryTotal(invoice.stageAndTruss);

      const currentSubTotalLEDGroup = l_T + li_T + s_l_T + st_T;
      const currentNetLEDGroup =
        currentSubTotalLEDGroup -
        (Number(invoice.discountTotalLEDLightingSoundStageTruss) || 0);

      const others =
        calculateCategoryTotal(invoice.powerSystems) +
        calculateCategoryTotal(invoice.videoSystems) +
        calculateCategoryTotal(invoice.technicianSystems) +
        calculateCategoryTotal(invoice.otherSystems);

      const currentSubTotal = currentNetLEDGroup + others;
      const currentOverallDiscount =
        (currentSubTotal * (Number(invoice.discountPercent) || 0)) / 100;
      const currentVAT = (currentSubTotal - currentOverallDiscount) * 0.18;

      return {
        subTotal: currentSubTotal,
        overallDiscount: currentOverallDiscount,
        vat: currentVAT,
        grandTotal: currentSubTotal - currentOverallDiscount + currentVAT,
      };
    };

    const totals = refreshTotals();

    return (
      <div className={`main-category-section ${colorClass}`} key={mainCatKey}>
        <h3 className="main-cat-title">
          {prefix}. {title}
        </h3>

        {isSimpleSection && subCats.length === 0 && (
          <div style={{ padding: "10px 20px" }}>
            <button
              className="btn-add-line"
              onClick={() => addSubCategory(mainCatKey)}
            >
              + Add First {title} Item
            </button>
          </div>
        )}

        {subCats.map((sub, subIdx) => (
          <div key={subIdx} className="sub-category-block">
            {!isSimpleSection && (
              <div
                className="sub-cat-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span className="prefix-label">
                    {prefix}.{subIdx + 1}
                  </span>
                  <input
                    className={`sub-title-input ${sub.isNew ? "highlight-input" : ""}`}
                    value={sub.subTitle}
                    autoFocus={sub.isNew}
                    onFocus={(e) => sub.isNew && e.target.select()}
                    onChange={(e) => {
                      // පළමු වරට අකුරු වෙනස් කළ සැණින් isNew අගය ඉවත් කරන්න
                      const updatedMain = [...invoice[mainCatKey]];
                      updatedMain[subIdx].subTitle = e.target.value;
                      updatedMain[subIdx].isNew = false;
                      setInvoice({ ...invoice, [mainCatKey]: updatedMain });
                    }}
                    placeholder="Enter Sub-category Name"
                  />
                </div>
                {/* LED Method Selector */}
                {mainCatKey === "ledSystems" && (
                  <div className="method-selector-header">
                    <label style={{ marginRight: "10px", fontWeight: "bold" }}>
                      Method:{" "}
                    </label>
                    <select
                      value={sub.calculationMethod || "unit"}
                      onChange={(e) =>
                        handleSubMethodChange(
                          mainCatKey,
                          subIdx,
                          e.target.value,
                        )
                      }
                    >
                      <option value="unit">By Qty (Unit Price)</option>
                      <option value="square">By Sq.Ft (Sq.Price)</option>
                    </select>
                  </div>
                )}
                <button
                  className="btn-delete-sub"
                  onClick={() => deleteSubCategory(mainCatKey, subIdx)}
                >
                  Delete Block
                </button>
              </div>
            )}

            <div className="items-table-container">
              <div className="table-header">
                <div className="col-ref">NO</div>
                <div className="col-desc">Description</div>
                {isTechnicianSection && (
                  <div className="col-distance" style={{ width: "80px" }}>
                    Distance(km)
                  </div>
                )}
                {mainCatKey === "ledSystems" && (
                  <>
                    <div className="col-width" style={{ width: "60px" }}>
                      Width
                    </div>
                    <div className="col-height" style={{ width: "60px" }}>
                      Height
                    </div>
                    <div className="col-square">Cube</div>
                  </>
                )}
                {mainCatKey === "powerSystems" && (
                  <>
                    <div className="col-days">Days</div>
                    <div className="col-hours">Hours</div>
                  </>
                )}
                {mainCatKey === "technicianSystems" && (
                  <div className="col-days">Days</div>
                )}
                <div className="col-qty">Qty</div>
                <div className="col-price">
                  {mainCatKey === "ledSystems" &&
                  sub.calculationMethod == "square"
                    ? "Sq.price"
                    : "Unit Price"}
                </div>
                <div className="col-total">Total</div>
                <div className="col-action" style={{ width: "30px" }}></div>
              </div>

              {sub.lineItems.map((item, itemIdx) => (
                <div className="item-row" key={itemIdx}>
                  <div className="col-ref">
                    {isSimpleSection
                      ? `${prefix}.${itemIdx + 1}`
                      : `${prefix}.${subIdx + 1}.${itemIdx + 1}`}
                  </div>

                  <div className="col-desc">
                    {isVideoSection || isOtherSection ? (
                      <input
                        type="text"
                        placeholder={`Enter details...`}
                        value={item.desc}
                        onChange={(e) =>
                          handleLineItemChange(
                            mainCatKey,
                            subIdx,
                            itemIdx,
                            "desc",
                            e.target.value,
                          )
                        }
                        className="desc-input-text"
                        style={{ width: "100%", padding: "4px" }}
                      />
                    ) : (
                      <>
                        <input
                          list={`price-list-${mainCatKey}-${subIdx}-${itemIdx}`} // Unique ID එකක්
                          className="desc-select"
                          value={item.desc}
                          placeholder="Type to search..."
                          onChange={(e) =>
                            handleLineItemChange(
                              mainCatKey,
                              subIdx,
                              itemIdx,
                              "desc",
                              e.target.value,
                            )
                          }
                        />
                        <datalist
                          id={`price-list-${mainCatKey}-${subIdx}-${itemIdx}`}
                        >
                          {priceList
                            .filter((p) => p.category === mainCatKey)
                            .map((p) => (
                              <option key={p._id} value={p.name} />
                            ))}
                        </datalist>
                      </>
                    )}
                  </div>
                  {isTechnicianSection && (
                    <div className="col-distance">
                      <input
                        type="number"
                        value={item.distance || ""}
                        onChange={(e) =>
                          handleLineItemChange(
                            mainCatKey,
                            subIdx,
                            itemIdx,
                            "distance",
                            e.target.value,
                          )
                        }
                        style={{ width: "70px" }}
                      />
                    </div>
                  )}

                  {/* LED Logic */}
                  {mainCatKey === "ledSystems" && (
                    <>
                      <div className="col-width">
                        <input
                          type="number"
                          value={item.width || 0}
                          onChange={(e) =>
                            handleLineItemChange(
                              mainCatKey,
                              subIdx,
                              itemIdx,
                              "width",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="col-height">
                        <input
                          type="number"
                          value={item.height || 0}
                          onChange={(e) =>
                            handleLineItemChange(
                              mainCatKey,
                              subIdx,
                              itemIdx,
                              "height",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="col-square">
                        <input
                          type="number"
                          value={item.cube || 0}
                          onChange={(e) =>
                            handleLineItemChange(
                              mainCatKey,
                              subIdx,
                              itemIdx,
                              "cube",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                    </>
                  )}

                  {mainCatKey === "powerSystems" && (
                    <>
                      <div className="col-days">
                        <input
                          type="number"
                          value={item.days || 1} // item.days ලෙස තිබිය යුතුයි
                          onChange={(e) =>
                            handleLineItemChange(
                              mainCatKey,
                              subIdx,
                              itemIdx,
                              "days", // මෙතන "days" ලෙස කුඩාවට ලියන්න
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="col-hours">
                        <input
                          type="number"
                          value={item.hours || 8}
                          onChange={(e) =>
                            handleLineItemChange(
                              mainCatKey,
                              subIdx,
                              itemIdx,
                              "hours",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                    </>
                  )}

                  {mainCatKey === "technicianSystems" && (
                    <div className="col-days">
                      <input
                        type="number"
                        value={item.days || 1}
                        onChange={(e) =>
                          handleLineItemChange(
                            mainCatKey,
                            subIdx,
                            itemIdx,
                            "days",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  )}

                  <div className="col-qty">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        handleLineItemChange(
                          mainCatKey,
                          subIdx,
                          itemIdx,
                          "qty",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="col-price">
                    <input
                      type="number"
                      value={
                        mainCatKey === "ledSystems" &&
                        sub.calculationMethod === "square"
                          ? item.sqPrice || 0
                          : item.unitPrice || 0
                      }
                      onChange={(e) =>
                        handleLineItemChange(
                          mainCatKey,
                          subIdx,
                          itemIdx,
                          mainCatKey === "ledSystems" &&
                            sub.calculationMethod === "square"
                            ? "sqPrice"
                            : "unitPrice",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="col-total">
                    {(item.rowTotal || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="col-action">
                    <button
                      className="btn-delete-line"
                      onClick={() =>
                        deleteLineItem(mainCatKey, subIdx, itemIdx)
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-add-line"
              onClick={() => addLineItem(mainCatKey, subIdx)}
            >
              + Add {title} Item
            </button>
          </div>
        ))}

        <div className="category-footer">
          Total for {title}: Rs.{" "}
          {categoryTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </div>

        {!isSimpleSection && (
          <button
            className="btn-add-sub"
            onClick={() => addSubCategory(mainCatKey)}
          >
            + Add Sub-Category
          </button>
        )}
      </div>
    );
  };
  // මේ ටික එතනින් අයින් කරන්න (Delete from current position)
  // const subTotal = calculateGrandTotal();
  // const discountAmount = Number(invoice.discount) || 0; // Number එකක් බවට පත් කරන්න
  // const totalValueOfSupply = subTotal - discountAmount;
  // const vat = totalValueOfSupply * 0.18;
  // const grandTotal = totalValueOfSupply + vat;

  const ledT = calculateCategoryTotal(invoice.ledSystems);
  const lightT = calculateCategoryTotal(invoice.lightSystems);
  const soundT = calculateCategoryTotal(invoice.soundSystems);
  const stageT = calculateCategoryTotal(invoice.stageAndTruss);

  const subTotalLEDGroup = ledT + lightT + soundT + stageT;
  const discountLEDGroup =
    Number(invoice.discountTotalLEDLightingSoundStageTruss) || 0;

  const netLEDGroup = subTotalLEDGroup - discountLEDGroup;

  const powerT = calculateCategoryTotal(invoice.powerSystems);
  const videoT = calculateCategoryTotal(invoice.videoSystems);
  const techT = calculateCategoryTotal(invoice.technicianSystems);
  const otherT = calculateCategoryTotal(invoice.otherSystems);
  const otherCategoriesTotal = powerT + videoT + techT + otherT;

  const subTotal = netLEDGroup + otherCategoriesTotal;

  const overallDiscount = Number(invoice.discount) || 0;

  const totalValueOfSupply = subTotal - overallDiscount;
  const vat = totalValueOfSupply * 0.18;
  const grandTotal = totalValueOfSupply + vat;

  const vatYes = (subTotal - (invoice.discountLED || 0)) * 0.18;
  const grandTotalYes = subTotal - (invoice.discountLED || 0) + vatYes;

  // subTotal යනු All Systems වල එකතුවයි
  const [editExtraRows, setEditExtraRows] = useState([
    { label: "Total Amount", value: subTotal },
  ]);

  const addExtraEditRow = () => {
    setEditExtraRows([...editExtraRows, { label: "", value: 0 }]);
  };

  const handleEditRowChange = (index, field, val) => {
    const updatedRows = [...editExtraRows];
    updatedRows[index][field] = field === "value" ? Number(val) : val;
    setEditExtraRows(updatedRows);
  };

  const activeSystems = [];
  if (invoice.ledSystems.some((s) => s.lineItems.length > 0))
    activeSystems.push("LED");
  if (invoice.lightSystems.some((s) => s.lineItems.length > 0))
    activeSystems.push("Light");
  if (invoice.soundSystems.some((s) => s.lineItems.length > 0))
    activeSystems.push("Sound");
  if (invoice.stageAndTruss.some((s) => s.lineItems.length > 0))
    activeSystems.push("Stage & Truss");

  const dynamicSystemsName =
    activeSystems.length > 0 ? activeSystems.join(", ") : "Systems";

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSuccessModalDiscount, setShowSuccessModalDiscount] =
    useState(false);
  const [finalMsg, setFinalMsg] = useState("");

  let allDaysTotal = 0;

  // Rehearsal total එකතු කිරීම
  allDaysTotal += invoice.rehearsalDay ? rehearsalAmount : 0;

  // Event days total එකතු කිරීම
  invoice.eventDate.forEach((date, idx) => {
    if (date) {
      allDaysTotal +=
        eventDayCustomValues[`day_${idx}_amt`] ?? subTotalLEDGroup;
    }
  });

  // 2. Discount එක ගණනය කිරීම (මුළු එකතුව මත)
  // සටහන: මෙතන පාවිච්චි වෙන්නේ මුළු දින ගණනේ එකතුව (allDaysTotal)
  const finalDiscountAmt = invoice.discount || 0;
  const finalPayable = allDaysTotal - finalDiscountAmt;
  const finalAllpayable = finalPayable + powerT + videoT + techT + otherT;

  return (
    <div className="invoice-container">
      <h2>Imagine Entertainment - Quotation System</h2>

      {/* 1. Header Info */}

      <div className="section grid-2">
        <div className="form-group">
          <label>Quotation Date:</label>

          <input
            type="date"
            onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>QT NO :</label>

          <input
            type="text"
            placeholder="T-000"
            required
            onChange={(e) =>
              setInvoice({ ...invoice, invoiceNo: e.target.value })
            }
          />
        </div>
      </div>

      {/* 2. Client Details (Designation සහ Company ඇතුළත් කර ඇත) */}

      <div className="section">
        <h3>Client Information</h3>

        <div className="grid-2">
          <input
            type="text"
            placeholder="Client TIN"
            required
            onChange={(e) =>
              setInvoice({ ...invoice, clientTIN: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Client Name"
            required
            onChange={(e) =>
              setInvoice({ ...invoice, ClientName: e.target.value })
            }
          />
        </div>

        <div className="grid-2" style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="Designation"
            required
            onChange={(e) =>
              setInvoice({ ...invoice, clientPosition: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Company Name"
            required
            onChange={(e) =>
              setInvoice({ ...invoice, companyName: e.target.value })
            }
          />
        </div>

        <textarea
          style={{ marginTop: "10px" }}
          placeholder="Client Address"
          required
          onChange={(e) =>
            setInvoice({ ...invoice, clientAddress: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Telephone Number"
          required
          onChange={(e) =>
            setInvoice({ ...invoice, clientTelephoneNumber: e.target.value })
          }
        />
      </div>

      {/* 3. Event Details */}

      <div className="section event-box">
        <h3>Event Details</h3>

        <div className="grid-2">
          <div className="form-group">
            <label>Event Location:</label>
            <input
              type="text"
              placeholder="Location"
              required
              onChange={(e) =>
                setInvoice({ ...invoice, eventLocation: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label> Rehearsal Date:</label>

            <input
              type="date"
              onChange={(e) =>
                setInvoice({ ...invoice, rehearsalDay: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Date(s) of Event:</label>
            <div className="event-dates-container">
              {invoice.eventDate.map((date, index) => (
                <div key={index} className="date-row">
                  <input
                    type="date"
                    className="date-input"
                    value={date}
                    required
                    onChange={(e) =>
                      handleEventDateChange(index, e.target.value)
                    }
                  />
                  {invoice.eventDate.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-date"
                      onClick={() => removeEventDate(index)}
                      title="Remove date"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-add-date"
                onClick={addEventDate}
              >
                + Add Another Date
              </button>
            </div>
          </div>
        </div>

        <textarea
          placeholder="Additional Event Info"
          required
          onChange={(e) =>
            setInvoice({ ...invoice, eventAdditionalInfo: e.target.value })
          }
        />
      </div>

      {/* 4. Categorized Items (1-8) */}

      {renderMainSection(
        "LED Screen System",

        invoice.ledSystems,

        "ledSystems",

        "1",

        "led-theme",
      )}

      {renderMainSection(
        "Lighting System",

        invoice.lightSystems,

        "lightSystems",

        "2",

        "light-theme",
      )}

      {renderMainSection(
        "Sound System",

        invoice.soundSystems,

        "soundSystems",

        "3",

        "sound-theme",
      )}

      {renderMainSection(
        "Power Generator",

        invoice.powerSystems,

        "powerSystems",

        "4",

        "power-theme",
      )}

      {renderStageTrussSection(
        "Stage & Truss System",
        invoice.stageAndTruss,
        "stageAndTruss",
        "5",
        "stage-theme",
      )}

      {renderMainSection(
        "Video Animation",

        invoice.videoSystems,

        "videoSystems",

        "6",

        "video-theme",
      )}

      {renderMainSection(
        "Technician & Transport",

        invoice.technicianSystems,

        "technicianSystems",

        "7",

        "tech-theme",
      )}

      {renderMainSection(
        "Other Services",

        invoice.otherSystems,

        "otherSystems",

        "8",

        "other-theme",
      )}

      {/* 5. Summary */}

      <div className="totals-area">
        {!isMultiDay ? (
          <>
            {/* 1. තනි දිනක දර්ශනය (Single Day View) */}
            <div className="total-line">
              Total Amount {dynamicSystemsName} per day :
              <span>
                Rs.{" "}
                {subTotalLEDGroup.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div
              className="total-line"
              style={{ color: "#d32f2f", fontWeight: "bold" }}
            >
              Discount / Sponsorship for {dynamicSystemsName}:
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <select
                  className="special-dropdown"
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #d32f2f",
                  }}
                  value={discountSelection}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDiscountSelection(val);
                    if (val === "No") {
                      setInvoice({
                        ...invoice,
                        discountTotalLEDLightingSoundStageTrussPercent: 0,
                        discountTotalLEDLightingSoundStageTruss: 0,
                      });
                      setShowSaveModal(true);
                      setShowTypeSelection(true);
                    } else if (val === "Yes") {
                      setShowSaveModal(true);
                      setShowTypeSelection(true);
                    }
                  }}
                >
                  <option value="Select">Select</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <hr
              style={{
                margin: "15px 0",
                border: "0",
                borderTop: "1px solid #ccc",
              }}
            />

            {/* Confirmed view - finalView හෝ finalViewYes දෙකෙන් එකක් ඇත්නම් පෙන්වයි */}
            {finalView || finalViewYes ? (
              <div
                className="final-confirmation-display"
                style={{
                  padding: "20px",
                  backgroundColor: "#f0f7f0",
                  borderRadius: "8px",
                  border: "1px solid #2e7d32",
                  maxWidth: "100%",
                  margin: "10px 0",
                }}
              >
                <h3
                  style={{
                    color: "#2e7d32",
                    marginTop: 0,
                    borderBottom: "1px solid #2e7d32",
                    paddingBottom: "10px",
                  }}
                >
                  Confirmed: {finalView || finalViewYes}
                </h3>

                <style>{`
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #c8e6c9; padding-bottom: 4px; }
            .info-value { font-weight: 500; text-align: right; }
          `}</style>

                {/* මෙතැනදී (finalView || finalViewYes) භාවිතයෙන් කොන්දේසි පරීක්ෂා කරන්න */}
                {(finalView === "Normal Quotation" 
                  ) && (
                  <>
                    <div className="info-row">
                      <strong>Grand Total Amount :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(subTotal - (invoice.discount || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Wording :</strong>
                      <span className="info-value">
                        {numberToWords(
                          Math.round(subTotal - (invoice.discount || 0)),
                        )}
                      </span>
                    </div>
                  </>
                )}
                     {(
                  finalViewYes === "Normal Quotation") && (
                  <>
                    <div className="info-row">
                      <strong>Grand Total Amount :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(subTotal - (invoice.discountLED || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Wording :</strong>
                      <span className="info-value">
                        {numberToWords(
                          Math.round(subTotal - (invoice.discountLED || 0)),
                        )}
                      </span>
                    </div>
                  </>
                )}

                {(finalView === "Normal Quotation with Discount" ||
                  finalViewYes === "Normal Quotation with Discount") && (
                  <>
                    <div className="info-row">
                      <strong>Sub Total Amount :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(
                          subTotal - (invoice.discountLED || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Less: Special Discount :</strong>
                      <span className="info-value">
                        Rs. {(invoice.discount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Grand Total Amount :</strong>
                      <span className="info-value">
                        Rs. {totalValueOfSupply.toLocaleString()}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Wording :</strong>
                      <span className="info-value">
                        {numberToWords(Math.round(totalValueOfSupply))}
                      </span>
                    </div>
                  </>
                )}

                {/* VAT Quotation කොටස් ද මේ ආකාරයටම (finalView || finalViewYes) භාවිතයෙන් ලියන්න */}
                {finalView === "Vat Quotation" && (
                  <>
                    <div className="info-row">
                      <strong>Total Value of Supply :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {subTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>VAT Amount(Total Value of Supply @18%) :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {vat.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Total Amount Including VAT :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(vat + subTotal).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Wording :</strong>
                      <span className="info-value">
                        {numberToWords(Math.round(subTotal))}
                      </span>
                    </div>
                  </>
                )}

                {finalViewYes === "Vat Quotation" && (
                  <>
                    <div className="info-row">
                      <strong>Total Value of Supply :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(subTotal - invoice.discountLED).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>VAT Amount(Total Value of Supply @18%) :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(
                          (subTotal - invoice.discountLED) *
                          0.18
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Total Amount Including VAT :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(
                          (subTotal - invoice.discountLED) * 0.18 +
                          (subTotal - invoice.discountLED)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Wording :</strong>
                      <span className="info-value">
                        {numberToWords(
                          Math.round(
                            (subTotal - invoice.discountLED) * 0.18 +
                              (subTotal - invoice.discountLED),
                          ),
                        )}
                      </span>
                    </div>
                  </>
                )}

                {finalView === "Vat Quotation with Discount" && (
                  <>
                    <div className="info-row">
                      <strong>Sub Total Amount :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {subTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Less: Special Discount :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(invoice.discount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Total Value of Supply :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {totalValueOfSupply.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>VAT Amount (Total value of Supply @18%) :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {vat.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="info-row">
                      <strong>Total Amount Including VAT :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Wording :</strong>
                      <span className="info-value">
                        {numberToWords(Math.round(grandTotal))}
                      </span>
                    </div>
                  </>
                )}
                {finalViewYes === "Vat Quotation with Discount" && (
                  <>
                    <div className="info-row">
                      <strong>Sub Total Amount :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(subTotal - invoice.discountLED).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Less: Special Discount :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(invoice.discount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Total Value of Supply :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(
                          subTotal -
                          invoice.discountLED -
                          invoice.discount
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>VAT Amount (Total value of Supply @18%) :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(
                          (subTotal - invoice.discountLED - invoice.discount) *
                          0.18
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="info-row">
                      <strong>Total Amount Including VAT :</strong>
                      <span className="info-value">
                        Rs.{" "}
                        {(
                          subTotal -
                          invoice.discountLED -
                          invoice.discount +
                          (subTotal - invoice.discountLED - invoice.discount) *
                            0.18
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="info-row">
                      <strong>Wording :</strong>
                      <span className="info-value">
                        {numberToWords(
                          Math.round(
                            subTotal -
                              invoice.discountLED -
                              invoice.discount +
                              (subTotal -
                                invoice.discountLED -
                                invoice.discount) *
                                0.18,
                          ),
                        )}
                      </span>
                    </div>
                  </>
                )}

                <div
                  className="info-row"
                  style={{ borderBottom: "none", marginTop: "10px" }}
                >
                  <strong>Mode of Payment :</strong>
                  <span className="info-value">
                    {(finalView || finalViewYes || "").includes("Vat")
                      ? 'cheque in favour of "Imagine Entertainment (Pvt) Ltd"'
                      : "Cash"}
                  </span>
                </div>
              </div>
            ) : (
              <h1 style={{ color: "#ccc", textAlign: "center" }}>
                No Quotation Saved Yet
              </h1>
            )}
          </>
        ) : (
          /* --- 2. බහු-දින දර්ශනය (Multi-day View) --- */
          <div
            className="multi-day-summary"
            style={{
              backgroundColor: "#fefefe",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          >
            <h3
              style={{
                color: "#1a237e",
                borderBottom: "2px solid #1a237e",
                paddingBottom: "5px",
              }}
            >
              Event Summary (Multi-day)
            </h3>

            <div className="info-row">
              <strong>Total Amount for {dynamicSystemsName} Per Day:</strong>
              <span className="info-value">
                Rs. {subTotalLEDGroup.toLocaleString()}
              </span>
            </div>

            {/* {invoice.rehearsalDay && (
              <div className="info-row">
                <strong>Rehearsal Day Charge:</strong>
                <span className="info-value">
                  Rs. {(subTotalLEDGroup * 0.5).toLocaleString()}
                </span>
              </div>
            )} */}

            {invoice.rehearsalDay && (
              <div
                className="info-row"
                style={{
                  alignItems: "center",
                  backgroundColor: "#fff9c4",
                  padding: "10px",
                  borderRadius: "5px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong>Rehearsal Day ({invoice.rehearsalDay}):</strong>
                </div>

                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  {/* Percentage Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <input
                      type="number"
                      value={rehearsalDiscountPercent}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        setRehearsalDiscountPercent(pct);
                        setRehearsalAmount((subTotalLEDGroup * pct) / 100);
                      }}
                      style={{
                        width: "50px",
                        padding: "4px",
                        textAlign: "right",
                        border: "1px solid #fbc02d",
                      }}
                    />
                    <span style={{ fontWeight: "bold" }}>%</span>
                  </div>

                  <span style={{ fontWeight: "bold" }}>=</span>

                  {/* Rupees Amount Input */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>Rs.</span>
                    <input
                      type="number"
                      value={rehearsalAmount}
                      onChange={(e) => {
                        const amt = parseFloat(e.target.value) || 0;
                        setRehearsalAmount(amt);
                        const pct =
                          subTotalLEDGroup > 0
                            ? (amt / subTotalLEDGroup) * 100
                            : 0;
                        setRehearsalDiscountPercent(pct.toFixed(0));
                      }}
                      style={{
                        width: "100px",
                        padding: "4px",
                        textAlign: "right",
                        border: "1px solid #fbc02d",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {invoice.eventDate.map((date, idx) => {
              if (!date) return null;

              // මෙම දවසේ දැනට පවතින අගයන් ලබා ගැනීම (නැතිනම් default base total එක පෙන්වයි)
              const currentDayAmt =
                eventDayCustomValues[`day_${idx}_amt`] ?? subTotalLEDGroup;
              const currentDayPct =
                eventDayCustomValues[`day_${idx}_pct`] ?? 100;

              return (
                <div
                  className="info-row"
                  key={idx}
                  style={{
                    alignItems: "center",
                    marginBottom: "10px",
                    padding: "5px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <strong>
                      {idx + 1}
                      {idx === 0
                        ? "st"
                        : idx === 1
                          ? "nd"
                          : idx === 2
                            ? "rd"
                            : "th"}{" "}
                      Day ({date}):
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {/* Day Percentage Input */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="number"
                        value={currentDayPct}
                        onChange={(e) => {
                          const pct = parseFloat(e.target.value) || 0;
                          const newAmt = (subTotalLEDGroup * pct) / 100;
                          setEventDayCustomValues((prev) => ({
                            ...prev,
                            [`day_${idx}_pct`]: pct,
                            [`day_${idx}_amt`]: newAmt,
                          }));
                        }}
                        style={{
                          width: "50px",
                          padding: "2px",
                          textAlign: "right",
                        }}
                      />
                      <span style={{ marginLeft: "2px" }}>%</span>
                    </div>

                    <span>=</span>

                    {/* Day Rupees Input */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", marginRight: "2px" }}>
                        Rs.
                      </span>
                      <input
                        type="number"
                        value={currentDayAmt}
                        onChange={(e) => {
                          const amt = parseFloat(e.target.value) || 0;
                          const pct =
                            subTotalLEDGroup > 0
                              ? (amt / subTotalLEDGroup) * 100
                              : 0;
                          setEventDayCustomValues((prev) => ({
                            ...prev,
                            [`day_${idx}_amt`]: amt,
                            [`day_${idx}_pct`]: pct.toFixed(0),
                          }));
                        }}
                        style={{
                          width: "90px",
                          padding: "2px",
                          textAlign: "right",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {(() => {
              // 1. වෙනස් කළ දිනවල අගයන් එකතු කිරීම
              let allDaysTotal = 0;

              // Rehearsal total එකතු කිරීම
              allDaysTotal += invoice.rehearsalDay ? rehearsalAmount : 0;

              // Event days total එකතු කිරීම
              invoice.eventDate.forEach((date, idx) => {
                if (date) {
                  allDaysTotal +=
                    eventDayCustomValues[`day_${idx}_amt`] ?? subTotalLEDGroup;
                }
              });

              // 2. Discount එක ගණනය කිරීම (මුළු එකතුව මත)
              // සටහන: මෙතන පාවිච්චි වෙන්නේ මුළු දින ගණනේ එකතුව (allDaysTotal)
              const finalDiscountAmt = invoice.discount || 0;
              const finalPayable = allDaysTotal - finalDiscountAmt;
              const finalAllpayable =
                finalPayable + powerT + videoT + techT + otherT;

              return (
                <>
                  {/* Total for All Days පේළිය */}
                  <div
                    className="info-row"
                    style={{
                      borderTop: "2px solid #333",
                      marginTop: "10px",
                      paddingTop: "5px",
                    }}
                  >
                    <strong>Total Amount for All days:</strong>
                    <span className="info-value" style={{ fontWeight: "bold" }}>
                      Rs.{" "}
                      {allDaysTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Less % Special Discount පේළිය (Input සහිතව) */}
                  <div
                    className="info-row"
                    style={{
                      alignItems: "center",
                      color: "#d32f2f",
                      margin: "10px 0",
                    }}
                  >
                    <strong>
                      Less % special Discount {dynamicSystemsName} :
                    </strong>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      {/* Percentage Input */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "2px",
                        }}
                      >
                        <input
                          type="number"
                          value={invoice.discountPercent || ""}
                          onChange={(e) => {
                            const pct = parseFloat(e.target.value) || 0;
                            const amt = (allDaysTotal * pct) / 100;
                            setInvoice({
                              ...invoice,
                              discountPercent: pct,
                              discount: amt,
                            });
                          }}
                          style={{
                            width: "50px",
                            padding: "4px",
                            textAlign: "right",
                            border: "1px solid #ffcdd2",
                            color: "#d32f2f",
                          }}
                        />
                        <span style={{ fontWeight: "bold" }}>%</span>
                      </div>

                      <span>=</span>

                      {/* Rupees Input */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "2px",
                        }}
                      >
                        <span style={{ fontSize: "12px" }}>Rs.</span>
                        <input
                          type="number"
                          value={invoice.discount || ""}
                          onChange={(e) => {
                            const amt = parseFloat(e.target.value) || 0;
                            const pct =
                              allDaysTotal > 0 ? (amt / allDaysTotal) * 100 : 0;
                            setInvoice({
                              ...invoice,
                              discount: amt,
                              discountPercent: pct.toFixed(2),
                            });
                          }}
                          style={{
                            width: "100px",
                            padding: "4px",
                            textAlign: "right",
                            border: "1px solid #ffcdd2",
                            color: "#d32f2f",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* අවසාන ශුද්ධ මුදල (Net Amount) */}
                  <div
                    className="info-row"
                    style={{
                      backgroundColor: "#e8f5e9",
                      padding: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    <strong>Total Amount After the discount :</strong>
                    <span
                      className="info-value"
                      style={{
                        color: "#2e7d32",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      Rs.{" "}
                      {finalPayable.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <div
                      className="final-action-section"
                      style={{ marginTop: "20px", textAlign: "right" }}
                    >
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "bold",
                          color: "#1a237e",
                        }}
                      >
                        Select Quotation Type to Save:
                      </label>

                      <select
                        style={{
                          padding: "12px",
                          borderRadius: "5px",
                          border: "2px solid #1a237e",
                          width: "250px",
                          fontSize: "14px",
                          cursor: "pointer",
                          backgroundColor: "#fff",
                        }}
                        value={quotationType} // දැනට තියෙන state එකම පාවිච්චි කරන්න
                        onChange={(e) => {
                          const selectedType = e.target.value;
                          if (selectedType !== "Select") {
                            setQuotationType(selectedType);

                            // පණිවිඩය සකස් කර Modal එක විවෘත කිරීම
                            setFinalMsg(
                              `You have selected ${selectedType}. Do you want to proceed with saving?`,
                            );

                            // ඔබ මීට පෙර හැදූ logic එක අනුව නිවැරදි Modal එක පෙන්වීම
                            if (discountSelection === "Yes") {
                              // setShowSuccessModalDiscount(true);
                            } else {
                              setShowSuccessModal(true);
                            }
                          }
                        }}
                      >
                        <option value="Select">-- Select Type --</option>
                        <option value="Normal Quotation More Days">
                          Normal Quotation
                        </option>
                        <option value="Vat Quotation More Days">
                          Vat Quotation
                        </option>
                      </select>
                    </div>
                  </div>

                  {finalView && (
                    <div
                      className="final-confirmation-display"
                      style={{
                        padding: "20px",
                        backgroundColor: "#f0f7f0",
                        borderRadius: "8px",
                        border: "1px solid #2e7d32",
                        maxWidth: "100%",
                        margin: "10px 0",
                      }}
                    >
                      <h3
                        style={{
                          color: "#2e7d32",
                          marginTop: 0,
                          borderBottom: "1px solid #2e7d32",
                          paddingBottom: "10px",
                        }}
                      >
                        Confirmed: {finalView}
                      </h3>

                      <style>{`
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #c8e6c9; padding-bottom: 4px; }
            .info-value { font-weight: 500; text-align: right; }
          `}</style>

                      {/* Normal Quotation More Days දර්ශනය */}
                      {finalView === "Normal Quotation More Days" && (
                        <>
                          <div className="info-row">
                            <strong>Grand Total Amount :</strong>
                            <span
                              className="info-value"
                              style={{ fontWeight: "bold" }}
                            >
                              Rs.{" "}
                              {finalAllpayable.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="info-row">
                            <strong>Wording :</strong>
                            <span className="info-value">
                              {numberToWords(Math.round(finalAllpayable))}
                            </span>
                          </div>

                          <div
                            className="info-row"
                            style={{ marginTop: "10px", borderBottom: "none" }}
                          >
                            <strong>Mode of Payment :</strong>
                            <span className="info-value">Cash</span>
                          </div>
                        </>
                      )}

                      {/* Vat Quotation More Days දර්ශනය */}
                      {finalView === "Vat Quotation More Days" && (
                        <>
                          <div className="info-row">
                            <strong>Total Value of Supply :</strong>
                            <span className="info-value">
                              Rs.{" "}
                              {finalAllpayable.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="info-row">
                            <strong>
                              VAT Amount (Total Value of Supply @18%) :
                            </strong>
                            <span className="info-value">
                              Rs.{" "}
                              {(finalAllpayable * 0.18).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </div>
                          <div
                            className="info-row"
                            style={{
                              fontWeight: "bold",
                              borderTop: "1px solid #2e7d32",
                              paddingTop: "5px",
                            }}
                          >
                            <strong>Total Amount Including VAT :</strong>
                            <span className="info-value">
                              Rs.{" "}
                              {(
                                finalAllpayable * 0.18 +
                                finalAllpayable
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="info-row">
                            <strong>Wording :</strong>
                            <span className="info-value">
                              {numberToWords(
                                Math.round(
                                  finalAllpayable * 0.18 + finalAllpayable,
                                ),
                              )}
                            </span>
                          </div>

                          <div
                            className="info-row"
                            style={{ marginTop: "10px", borderBottom: "none" }}
                          >
                            <strong>Mode of Payment :</strong>
                            <span className="info-value">
                              cheque in favour of "Imagine Entertainment (Pvt)
                              Ltd"
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      <button className="btn-generate" onClick={handleSaveQuotation}>
        Create Quotation
      </button>

      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-content custom-popup">
            {/* 1. මුලින්ම පෙන්වන කොටස (Normal or More than days) */}
            {!isMoreThanDays && !showSummary && (
              <div>
                {/* මුල් පියවර: Normal / More than days */}
                {!showTypeSelection && !showEditConfirmation ? (
                  <>
                    {/* <h3 style={{ color: "#1a237e" }}>Save Quotation</h3>
                    <div className="popup-actions">
                      <button
                        className="btn-normal"
                        onClick={() => setShowTypeSelection(true)}
                      >
                        Normal Quotation
                      </button>
                      <button
                        className="btn-special"
                        onClick={() => setIsMoreThanDays(true)}
                      >
                        More than days
                      </button>
                    </div> */}
                  </>
                ) : showEditConfirmation ? (
                  /* 2. "edit" තෝරා Confirm කළ පසු පෙන්වන Edit Notice Popup එක */
                  <>
                    {/* <h3 style={{ color: "#d32f2f", marginBottom: "15px" }}>
                      Edit Quotation Notice
                    </h3>

                    <div
                      style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        marginBottom: "10px",
                      }}
                    >
                      {editExtraRows.map((row, index) => (
                        <div
                          key={index}
                          className="edit-row-item"
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: "10px",
                            marginBottom: "10px",
                            backgroundColor: "#f4f4f4",
                            padding: "10px",
                            borderRadius: "5px",
                          }}
                        >
                          <div style={{ flex: 2 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: "bold",
                                marginBottom: "4px",
                              }}
                            >
                              Description
                            </label>
                            <input
                              type="text"
                              value={row.label}
                              placeholder="e.g. Total Amount"
                              onChange={(e) =>
                                handleEditRowChange(
                                  index,
                                  "label",
                                  e.target.value,
                                )
                              }
                              style={{
                                width: "100%",
                                padding: "6px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: "11px",
                                fontWeight: "bold",
                                marginBottom: "4px",
                              }}
                            >
                              Amount (Rs.)
                            </label>
                            <input
                              type="number"
                              value={row.value}
                              onChange={(e) =>
                                handleEditRowChange(
                                  index,
                                  "value",
                                  e.target.value,
                                )
                              }
                              style={{
                                width: "100%",
                                padding: "6px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                          {index > 0 && (
                            <button
                              onClick={() =>
                                setEditExtraRows(
                                  editExtraRows.filter((_, i) => i !== index),
                                )
                              }
                              style={{
                                color: "white",
                                backgroundColor: "#ff4d4d",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px 10px",
                                cursor: "pointer",
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addExtraEditRow}
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "20px",
                        backgroundColor: "#e3f2fd",
                        border: "1px dashed #2196f3",
                        color: "#1976d2",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      + Add Another Amount Row
                    </button>

                    <div className="popup-actions">
                      <button
                        className="btn-update"
                        onClick={() => {
                          // Edit කිරීමට අදාළ logic එක
                          console.log("Saving Edited Rows:", editExtraRows);
                          saveToDatabase("Edited");
                        }}
                      >
                        Yes, Proceed
                      </button>
                      <button
                        className="btn-close"
                        onClick={() => setShowEditConfirmation(false)}
                      >
                        Cancel
                      </button>
                    </div> */}
                  </>
                ) : (
                  /* 3. Selection පියවර (Category තෝරා ගැනීම) */
                  <>
                    <h3 style={{ color: "#2e7d32" }}>Select Quotation Type</h3>
                    <div
                      className="form-group"
                      style={{ marginBottom: "20px", textAlign: "left" }}
                    >
                      <label
                        style={{
                          fontWeight: "bold",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        Choose Category:
                      </label>
                      <select
                        value={quotationType}
                        onChange={(e) => setQuotationType(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "5px",
                          border: "2px solid #2e7d32",
                        }}
                      >
                        <option value="Normal Quotation">
                          Normal Quotation
                        </option>
                        <option value="Normal Quotation with Discount">
                          Normal Quotation with Discount
                        </option>
                        <option value="Vat Quotation">Vat Quotation</option>
                        <option value="Vat Quotation with Discount">
                          Vat Quotation with Discount
                        </option>
                        {/* <option value="edit">Edit Quotation</option> */}
                      </select>
                    </div>

                    <div className="popup-actions">
                      <button
                        className="btn-confirm-save"
                        style={{ backgroundColor: "#2e7d32", color: "white" }}
                        onClick={() => {
                          // දැන් මෙතනදී පරීක්ෂා කරන්නේ අපේ state එකයි
                          if (discountSelection === "No") {
                            setFinalMsg(
                              `You have selected ${quotationType}. Do you want to proceed with saving?`,
                            );
                            setShowSuccessModal(true);
                          } else if (discountSelection === "Yes") {
                            setFinalMsg(
                              `You have selected ${quotationType}. Do you want to proceed with saving?`,
                            );
                            // මෙහිදී ඔබ භාවිතා කරන නිවැරදි function එක කැඳවන්න
                            if (
                              typeof setShowSuccessModalDiscount === "function"
                            ) {
                              setShowSuccessModalDiscount(true);
                            } else {
                              // සමහරවිට ඔබ වැරදීමකින් showSuccessModalDiscount(true) ලෙස ලියා තිබුණා විය හැක
                              // එය state setter එකක් නම් setShowSuccessModalDiscount(true) විය යුතුය
                            }
                          }
                        }}
                      >
                        Confirm & Save
                      </button>
                      {/* <button
                        className="btn-close"
                        onClick={() => setShowTypeSelection(false)}
                      >
                        Back
                      </button> */}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2. "More than days" එබූ විට පෙන්වන කොටස */}
            {isMoreThanDays && !showSummary && (
              <>
                <h3 style={{ color: "#d32f2f" }}>Special Event Note</h3>

                {/* දවස් ගණන (Days) - මෙතනට පාවිච්චි කරන්නේ specialNote */}
                {/* <div className="NumberDaysFull">
                  <label>How many days do event?</label>
                  <input
                    type="number"
                    className="NumberDays"
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)} // දවස් ගණන පමණක් මෙතනින් වෙනස් වේ
                  />
                </div> */}

                {/* Rehearsal එක (Yes/No) - මෙතනට පාවිච්චි කරන්නේ අලුත් isRehearsal state එක */}
                {/* <div className="NumberDaysFull">
                  <label>Is this a rehearsal?</label>
                  <select
                    className="special-dropdown"
                    value={isRehearsal}
                    onChange={(e) => setIsRehearsal(e.target.value)} // Rehearsal status එක පමණක් මෙතනින් වෙනස් වේ
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="popup-actions">
                  <button className="btn-update" onClick={handleShowSummary}>
                    Confirm & Save
                  </button>
                  <button
                    className="btn-close"
                    onClick={() => setIsMoreThanDays(false)}
                  >
                    Back
                  </button>
                </div> */}
              </>
            )}

            {/* 3. අවසාන වශයෙන් පෙන්වන Summary Table එක */}
            {showSummary && !showTypeSelection && (
              <>
                <h3
                  style={{
                    color: "#2e7d32",
                    marginBottom: "20px",
                    fontSize: "24px",
                    textAlign: "center",
                  }}
                >
                  Quotation Summary Preview
                </h3>
                <div
                  className="summary-tables-wrapper"
                  style={{
                    maxHeight: "550px",
                    overflowY: "auto",
                    padding: "10px",
                  }}
                >
                  {(() => {
                    const ledT = calculateCategoryTotal(invoice.ledSystems);
                    const lightT = calculateCategoryTotal(invoice.lightSystems);
                    const soundT = calculateCategoryTotal(invoice.soundSystems);
                    const stageT = calculateCategoryTotal(
                      invoice.stageAndTruss,
                    );
                    const powerT = calculateCategoryTotal(invoice.powerSystems);
                    const videoT = calculateCategoryTotal(invoice.videoSystems);
                    const techT = calculateCategoryTotal(
                      invoice.technicianSystems,
                    );
                    const otherT = calculateCategoryTotal(invoice.otherSystems);

                    const tables = [
                      {
                        id: "led",
                        title: "LED, Lighting, Sound, Stage & Truss Systems",
                        total: ledT + lightT + soundT + stageT,
                      },
                      {
                        id: "power",
                        title: "Power Generator System",
                        total: powerT,
                      },
                      {
                        id: "video",
                        title: "Video Animation Services",
                        total: videoT,
                      },
                      {
                        id: "tech",
                        title: "Technician & Transport Charges",
                        total: techT,
                      },
                      { id: "other", title: "Other Services", total: otherT },
                    ];

                    return tables.map((table) => (
                      <table
                        key={table.id}
                        className="summary-table"
                        style={{
                          marginBottom: "30px",
                          width: "100%",
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead>
                          <tr style={{ backgroundColor: "#f5f5f5" }}>
                            <th
                              style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                textAlign: "left",
                                width: "200px",
                              }}
                            >
                              Description
                            </th>
                            <th
                              style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                textAlign: "right",
                                width: "250px",
                              }}
                            >
                              Discount (Rs.) or %
                            </th>
                            <th
                              style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                textAlign: "right",
                                width: "200px",
                              }}
                            >
                              Amount (Rs.)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Main Category Row */}
                          <tr
                            style={{
                              backgroundColor: "#fdfdfd",
                              fontWeight: "bold",
                            }}
                          >
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                              }}
                            >
                              {table.title}
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                textAlign: "right",
                              }}
                            >
                              -
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                textAlign: "right",
                              }}
                            >
                              {table.total.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>

                          {/* Rehearsal Day Row */}
                          {isRehearsal === "Yes" && (
                            <tr style={{ backgroundColor: "#fff9c4" }}>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "10px",
                                  paddingLeft: "30px",
                                  fontWeight: "600",
                                  color: "#d32f2f",
                                }}
                              >
                                Rehearsal Day
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "5px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        width: "30px",
                                        color: "#666",
                                      }}
                                    >
                                      Rs.
                                    </span>
                                    <input
                                      type="number"
                                      value={
                                        summaryDayValues[
                                          `${table.id}_rehearsal_discount_rs`
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        handleSummaryPriceChange(
                                          table.id,
                                          "rehearsal",
                                          "rs",
                                          e.target.value,
                                          table.total,
                                        )
                                      }
                                      style={{ flex: 1, padding: "4px" }}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        width: "30px",
                                        color: "#666",
                                      }}
                                    >
                                      %
                                    </span>
                                    <input
                                      type="number"
                                      value={
                                        summaryDayValues[
                                          `${table.id}_rehearsal_discount_percent`
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        handleSummaryPriceChange(
                                          table.id,
                                          "rehearsal",
                                          "percent",
                                          e.target.value,
                                          table.total,
                                        )
                                      }
                                      style={{ flex: 1, padding: "4px" }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "12px",
                                  textAlign: "right",
                                  fontWeight: "bold",
                                  color: "#2e7d32",
                                }}
                              >
                                {parseFloat(
                                  summaryDayValues[
                                    `${table.id}_rehearsal_amount`
                                  ] || table.total,
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          )}

                          {/* Event Days Rows */}
                          {[...Array(Number(specialNote) || 0)].map((_, i) => (
                            <tr key={i}>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "10px",
                                  paddingLeft: "30px",
                                  color: "#555",
                                }}
                              >
                                Day {i + 1}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "5px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        width: "30px",
                                        color: "#666",
                                      }}
                                    >
                                      Rs.
                                    </span>
                                    <input
                                      type="number"
                                      value={
                                        summaryDayValues[
                                          `${table.id}_${i}_discount_rs`
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        handleSummaryPriceChange(
                                          table.id,
                                          i,
                                          "rs",
                                          e.target.value,
                                          table.total,
                                        )
                                      }
                                      style={{ flex: 1, padding: "4px" }}
                                    />
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        width: "30px",
                                        color: "#666",
                                      }}
                                    >
                                      %
                                    </span>
                                    <input
                                      type="number"
                                      value={
                                        summaryDayValues[
                                          `${table.id}_${i}_discount_percent`
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        handleSummaryPriceChange(
                                          table.id,
                                          i,
                                          "percent",
                                          e.target.value,
                                          table.total,
                                        )
                                      }
                                      style={{ flex: 1, padding: "4px" }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "12px",
                                  textAlign: "right",
                                  fontWeight: "bold",
                                }}
                              >
                                {parseFloat(
                                  summaryDayValues[`${table.id}_${i}_amount`] ||
                                    table.total,
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                          {/* --- 1. Total පේළිය (මෙම අගය Discount එක නිසා වෙනස් නොවේ) --- */}
                          <tr
                            style={{
                              backgroundColor: "#e8f5e9",
                              fontWeight: "bold",
                            }}
                          >
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                              }}
                            >
                              Total: {table.title}
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "8px",
                                textAlign: "right",
                              }}
                            >
                              Rs.
                            </td>
                            <td
                              style={{
                                border: "1px solid #ddd",
                                padding: "12px",
                                textAlign: "right",
                              }}
                            >
                              {(() => {
                                let subTotal = 0;
                                if (isRehearsal === "Yes") {
                                  subTotal += parseFloat(
                                    summaryDayValues[
                                      `${table.id}_rehearsal_amount`
                                    ] || 0,
                                  );
                                }
                                for (
                                  let i = 0;
                                  i < (Number(specialNote) || 0);
                                  i++
                                ) {
                                  subTotal += parseFloat(
                                    summaryDayValues[
                                      `${table.id}_${i}_amount`
                                    ] || 0,
                                  );
                                }
                                return subTotal.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                });
                              })()}
                            </td>
                          </tr>

                          {/* --- 2. LED Group Discount Input පේළිය --- */}
                          {table.id === "led" && (
                            <tr style={{ backgroundColor: "#fff5f5" }}>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "12px",
                                  color: "#d32f2f",
                                  fontWeight: "bold",
                                }}
                              >
                                Less: Special Discount / Sponsorship
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                  }}
                                >
                                  {/* --- Rupees (Rs.) Input --- */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "5px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        width: "30px",
                                        color: "#666",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Rs.
                                    </span>
                                    <input
                                      type="number"
                                      value={
                                        invoice.discountTotalLEDLightingSoundStageTruss ||
                                        ""
                                      }
                                      onChange={(e) => {
                                        const rsVal =
                                          parseFloat(e.target.value) || 0;

                                        // 1. Total එක ගණනය කිරීම
                                        let subTotal = 0;
                                        if (isRehearsal === "Yes") {
                                          subTotal += parseFloat(
                                            summaryDayValues[
                                              `${table.id}_rehearsal_amount`
                                            ] || 0,
                                          );
                                        }
                                        for (
                                          let i = 0;
                                          i < (Number(specialNote) || 0);
                                          i++
                                        ) {
                                          subTotal += parseFloat(
                                            summaryDayValues[
                                              `${table.id}_${i}_amount`
                                            ] || 0,
                                          );
                                        }

                                        // 2. Rs අනුව % සෙවීම
                                        const calculatedPercent =
                                          subTotal > 0
                                            ? (rsVal / subTotal) * 100
                                            : 0;

                                        setInvoice((prev) => ({
                                          ...prev,
                                          discountTotalLEDLightingSoundStageTruss:
                                            rsVal,
                                          discountTotalLEDLightingSoundStageTrussPercent:
                                            calculatedPercent.toFixed(2),
                                        }));
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: "4px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                      }}
                                      placeholder="Amount"
                                    />
                                  </div>

                                  {/* --- Percentage (%) Input --- */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "5px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        width: "30px",
                                        color: "#666",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      %
                                    </span>
                                    <input
                                      type="number"
                                      value={
                                        invoice.discountTotalLEDLightingSoundStageTrussPercent ||
                                        ""
                                      }
                                      onChange={(e) => {
                                        const perVal =
                                          parseFloat(e.target.value) || 0;

                                        // 1. Total එක ගණනය කිරීම
                                        let subTotal = 0;
                                        if (isRehearsal === "Yes") {
                                          subTotal += parseFloat(
                                            summaryDayValues[
                                              `${table.id}_rehearsal_amount`
                                            ] || 0,
                                          );
                                        }
                                        for (
                                          let i = 0;
                                          i < (Number(specialNote) || 0);
                                          i++
                                        ) {
                                          subTotal += parseFloat(
                                            summaryDayValues[
                                              `${table.id}_${i}_amount`
                                            ] || 0,
                                          );
                                        }

                                        // 2. % අනුව Rs සෙවීම
                                        const calculatedRs =
                                          (subTotal * perVal) / 100;

                                        setInvoice((prev) => ({
                                          ...prev,
                                          discountTotalLEDLightingSoundStageTrussPercent:
                                            perVal,
                                          discountTotalLEDLightingSoundStageTruss:
                                            calculatedRs,
                                        }));
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: "4px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                      }}
                                      placeholder="Percentage"
                                    />
                                  </div>
                                </div>
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "12px",
                                  textAlign: "right",
                                  color: "#d32f2f",
                                  fontWeight: "bold",
                                }}
                              >
                                (
                                {Number(
                                  invoice.discountTotalLEDLightingSoundStageTruss ||
                                    0,
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                                )
                              </td>
                            </tr>
                          )}

                          {/* --- 3. Net Payable Amount (Discount එක අඩු වූ පසු අගය) --- */}
                          {table.id === "led" && (
                            <tr
                              style={{
                                backgroundColor: "#e8f5e9",
                                fontWeight: "bold",
                              }}
                            >
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "12px",
                                  fontSize: "15px",
                                }}
                              >
                                Net Payable Amount:
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "8px",
                                  textAlign: "right",
                                }}
                              >
                                Rs.
                              </td>
                              <td
                                style={{
                                  border: "1px solid #ddd",
                                  padding: "12px",
                                  textAlign: "right",
                                  color: "#2e7d32",
                                  fontSize: "18px",
                                }}
                              >
                                {(() => {
                                  let currentTotal = 0;
                                  if (isRehearsal === "Yes") {
                                    currentTotal += parseFloat(
                                      summaryDayValues[
                                        `${table.id}_rehearsal_amount`
                                      ] || 0,
                                    );
                                  }
                                  for (
                                    let i = 0;
                                    i < (Number(specialNote) || 0);
                                    i++
                                  ) {
                                    currentTotal += parseFloat(
                                      summaryDayValues[
                                        `${table.id}_${i}_amount`
                                      ] || 0,
                                    );
                                  }

                                  // Discount එක අඩු කර ශේෂය ගණනය කිරීම
                                  const finalBalance =
                                    currentTotal -
                                    parseFloat(
                                      invoice.discountTotalLEDLightingSoundStageTruss ||
                                        0,
                                    );

                                  return (
                                    finalBalance < 0 ? 0 : finalBalance
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  });
                                })()}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ));
                  })()}

                  {/* Grand Total Section (Remaining same as yours) */}
                  {/* Summary Tables අවසන් වූ පසු මෙම ගණනය කිරීම් එක් කරන්න */}
                  {(() => {
                    let summarySubTotal = 0;

                    // 1. මුලින්ම LED Group එකට අදාළ totals සහ එහි discount එක ගණනය කරමු
                    const ledT = calculateCategoryTotal(invoice.ledSystems);
                    const lightT = calculateCategoryTotal(invoice.lightSystems);
                    const soundT = calculateCategoryTotal(invoice.soundSystems);
                    const stageT = calculateCategoryTotal(
                      invoice.stageAndTruss,
                    );

                    const totalLEDGroupBeforeDiscount =
                      ledT + lightT + soundT + stageT;
                    const ledGroupDiscountAmount =
                      Number(invoice.discountTotalLEDLightingSoundStageTruss) ||
                      0;

                    // LED Group එකේ Discount අඩු කළ පසු ශේෂය (Net LED Amount)
                    const netLEDGroup =
                      totalLEDGroupBeforeDiscount - ledGroupDiscountAmount;

                    const powerT = calculateCategoryTotal(invoice.powerSystems);
                    const videoT = calculateCategoryTotal(invoice.videoSystems);
                    const techT = calculateCategoryTotal(
                      invoice.technicianSystems,
                    );
                    const otherT = calculateCategoryTotal(invoice.otherSystems);

                    // 2. Categories array එක සකසමු (මෙහි led එකට netLEDGroup ලබා දී ඇත)
                    const netLEDGroupValue =
                      totalLEDGroupBeforeDiscount - ledGroupDiscountAmount;
                    const categories = [
                      {
                        id: "led",
                        title: "LED, Lighting, Sound, Stage & Truss Systems",
                        total: netLEDGroupValue, // <--- මෙන්න මෙතනට Discount කළ අගය ආදේශ කළා
                      },
                      { id: "power", total: powerT },
                      { id: "video", total: videoT },
                      { id: "tech", total: techT },
                      { id: "other", total: otherT },
                    ];

                    // 3. මුළු එකතුව (summarySubTotal) ගණනය කිරීම
                    categories.forEach((cat) => {
                      if (isRehearsal === "Yes") {
                        summarySubTotal += parseFloat(
                          summaryDayValues[`${cat.id}_rehearsal_amount`] ||
                            cat.total,
                        );
                      }
                      for (let i = 0; i < (Number(specialNote) || 0); i++) {
                        summarySubTotal += parseFloat(
                          summaryDayValues[`${cat.id}_${i}_amount`] ||
                            cat.total,
                        );
                      }
                    });

                    // 4. Overall Discount සහ Tax ගණනය කිරීම
                    const summaryDiscount =
                      (summarySubTotal *
                        (Number(invoice.discountPercent) || 0)) /
                      100;

                    const summarySubTotal1 =
                      summarySubTotal -
                      (Number(
                        invoice.discountTotalLEDLightingSoundStageTruss,
                      ) || 0); // LED Group Discount එක අඩු කළ පසු Subtotal
                    const summaryTotalValue =
                      summarySubTotal1 - summaryDiscount;
                    const summaryVat = summaryTotalValue * 0.18;
                    const summaryGrandTotal = summaryTotalValue + summaryVat;

                    return (
                      <div
                        className="summary-final-breakdown"
                        style={{
                          marginTop: "20px",
                          padding: "15px",
                          borderTop: "2px solid #ddd",
                          backgroundColor: "#f9f9f9",
                          borderRadius: "8px",
                        }}
                      >
                        {/* Total Amount (LED Group Discount එක අඩු කළ පසු) */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <span>Total Amount:</span>
                          <strong style={{ fontSize: "16px" }}>
                            Rs.{" "}
                            {summarySubTotal1.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </strong>
                        </div>

                        {/* Overall Discount Input */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px",
                            padding: "10px",
                            backgroundColor: "#fff5f5",
                            borderRadius: "5px",
                            border: "1px solid #ffcdd2",
                          }}
                        >
                          <span
                            style={{ fontWeight: "bold", color: "#d32f2f" }}
                          >
                            Overall Discount / Sponsorship:
                          </span>
                          <div
                            style={{
                              display: "flex",
                              gap: "15px",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <span style={{ fontSize: "12px", color: "#666" }}>
                                %
                              </span>
                              <input
                                type="number"
                                value={invoice.discountPercent || ""}
                                onChange={(e) => {
                                  const pct = parseFloat(e.target.value) || 0;
                                  setInvoice({
                                    ...invoice,
                                    discountPercent: pct,
                                    discount: (summarySubTotal * pct) / 100,
                                  });
                                }}
                                style={{
                                  width: "60px",
                                  padding: "4px",
                                  border: "1px solid #ccc",
                                }}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <span style={{ fontSize: "12px", color: "#666" }}>
                                Rs.
                              </span>
                              <input
                                type="number"
                                value={invoice.discount || ""}
                                onChange={(e) => {
                                  const dsnt = parseFloat(e.target.value) || 0;
                                  setInvoice({
                                    ...invoice,
                                    discount: dsnt,
                                    discountPercent:
                                      summarySubTotal > 0
                                        ? (
                                            (dsnt / summarySubTotal) *
                                            100
                                          ).toFixed(2)
                                        : 0,
                                  });
                                }}
                                style={{
                                  width: "100px",
                                  padding: "4px",
                                  border: "1px solid #ccc",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Final Values */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                            borderTop: "1px dashed #ccc",
                            paddingTop: "8px",
                          }}
                        >
                          <span>Total Value of Supply:</span>
                          <strong style={{ fontSize: "16px" }}>
                            Rs.{" "}
                            {summaryTotalValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </strong>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <span>VAT Amount (18%):</span>
                          <strong>
                            Rs.{" "}
                            {summaryVat.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </strong>
                        </div>

                        <div
                          style={{
                            marginTop: "10px",
                            padding: "20px",
                            backgroundColor: "#e8f5e9",
                            borderRadius: "10px",
                            border: "2px solid #c8e6c9",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "20px",
                            }}
                          >
                            <strong>
                              Grand Total (Final Amount with VAT):
                            </strong>
                            <strong style={{ color: "#2e7d32" }}>
                              Rs.{" "}
                              {summaryGrandTotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div
                  className="popup-actions"
                  style={{
                    marginTop: "30px",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: "20px",
                  }}
                >
                  <button
                    className="btn-confirm-save"
                    style={{ padding: "15px 40px", fontSize: "16px" }}
                    onClick={() => {
                      setShowTypeSelection(true);
                      setShowSummary(false);
                      setIsMoreThanDays(false);
                    }}
                  >
                    Final Confirm & Save
                  </button>
                  <button
                    className="btn-close"
                    style={{ padding: "15px 40px", fontSize: "16px" }}
                    onClick={() => setShowSummary(false)}
                  >
                    Back to Edit
                  </button>
                </div>
              </>
            )}

            <button
              className="close-x"
              onClick={() => {
                setShowSaveModal(false);
                setShowSummary(false);
                setIsMoreThanDays(false);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      <ShowSuccessModal
        show={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onConfirm={() => {
          setFinalView(quotationType);
          setShowSuccessModal(false);
          setShowSaveModal(false);
          // මෙතනදී saveToDatabase(quotationType) call කළ හැක
        }}
        quotationType={quotationType}
        dynamicSystemsName={dynamicSystemsName}
        invoice={invoice}
        subTotal={subTotal}
        subTotalLEDGroup={subTotalLEDGroup}
        totalValueOfSupply={totalValueOfSupply}
        vat={vat}
        grandTotal={grandTotal}
        vatYes={vatYes}
        grandTotalYes={grandTotalYes}
        numberToWords={numberToWords}
        setInvoice={setInvoice}
        finalPayable={finalPayable}
        finalAllpayable={finalAllpayable}
      />

      <ShowSuccessModalDiscount
        show={showSuccessModalDiscount}
        onClose={() => setShowSuccessModalDiscount(false)}
        onConfirm={() => {
          setFinalViewYes(quotationType);
          setShowSuccessModalDiscount(false);
          setShowSaveModal(false);
          // මෙතනදී saveToDatabase(quotationType) call කළ හැක

        }}
        quotationType={quotationType}
        dynamicSystemsName={dynamicSystemsName}
        invoice={invoice}
        subTotal={subTotal}
        subTotalLEDGroup={subTotalLEDGroup}
        totalValueOfSupply={totalValueOfSupply}
        vat={vat}
        grandTotal={grandTotal}
        vatYes={vatYes}
        grandTotalYes={grandTotalYes}
        numberToWords={numberToWords}
        setInvoice={setInvoice}
      />
    </div>
  );
};

export default InvoiceForm;
