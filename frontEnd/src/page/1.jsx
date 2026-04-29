import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/home.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ViewQuotation() {
  const [quotations, setQuotations] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const addSubCategoryInModal = (catKey) => {
    const newSub = {
      subTitle: "New Sub-category",
      lineItems: [{ desc: "", qty: 1, unitPrice: 0 }],
    };
    const updatedQuote = { ...selectedQuote };
    updatedQuote[catKey] = [...updatedQuote[catKey], newSub];
    setSelectedQuote(updatedQuote);
  };

  const addLineItemInModal = (catKey, subIdx) => {
    const newItem = { desc: "", qty: 1, unitPrice: 0 };
    const updatedQuote = { ...selectedQuote };
    updatedQuote[catKey][subIdx].lineItems.push(newItem);
    setSelectedQuote(updatedQuote);
  };

  const fetchQuotations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/quotations");
      if (Array.isArray(res.data)) {
        setQuotations(res.data);
      } else if (res.data.quotations) {
        setQuotations(res.data.quotations);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setQuotations([]);
    }
  };

  const openEditModal = (quote) => {
    setSelectedQuote(quote);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setSelectedQuote({ ...selectedQuote, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/quotations/${selectedQuote._id}`,
        selectedQuote,
      );
      alert("✅ Updated Successfully!");
      setShowModal(false);
      fetchQuotations();
    } catch (err) {
      alert("❌ Update Failed!");
    }
  };
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
    let str = "Rupees "; // 🟢 මුලින්ම "Rupees" යන වචනය එක් කරයි

    str +=
      n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + a[n[1][1]]) + "Crore " : "";
    str +=
      n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + a[n[2][1]]) + "Lakh " : "";
    str +=
      n[3] != 0
        ? (a[Number(n[3])] || b[n[3][0]] + a[n[3][1]]) + "Thousand "
        : "";
    str +=
      n[4] != 0
        ? (a[Number(n[4])] || b[n[4][0]] + a[n[4][1]]) + "Hundred "
        : "";

    // අවසාන කොටස "and" සමඟ "Only" එක් කිරීම
    if (n[5] != 0) {
      str +=
        (str != "Rupees " ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + a[n[5][1]]) +
        "Only";
    } else {
      str += "Only";
    }
    return str;
  };
  // -- devide two pdf

  const generatePDF = (q) => {
    if (q.nomal === 0) {
      generateSummaryPDF(q);
    } else {
      generateNormalPDF(q);
    }
  };

  // --- PDF GENERATION FUNCTION ---
  const generateNormalPDF = (q) => {
    const doc = new jsPDF();
    const headerImg = "/image/header.jpeg";

    const drawPageBorder = () => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("IMAGINE ENTERTAINMENT (PVT) LTD", 105, 292, {
        align: "center",
      });
      doc.text("QT NO: " + q.invoiceNo, 10, 292, { align: "left" }); // Margin එකට ගැලපුවා
    };

    const drawHeader = (isFirstPage) => {
      if (isFirstPage) {
        // Header එක මැදට ගැනීම (Page Width 210 - Image Width 150) / 2 = 30
        doc.addImage(headerImg, "JPEG", 30, 10, 150, 25);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.rect(65, 40.5, 80, 6);
        doc.text("QUOTATION", 105, 45, { align: "center" });
        // doc.setFontSize(8);
        // doc.text("DUPLICATE", 195, 45, { align: "right" });
      }
    };

    drawPageBorder();
    drawHeader(true);

    let startY = 53;
    const pAddr = (q.clientAddress || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    const addressLinesCount = pAddr.length;
    const addressOffset =
      addressLinesCount > 4 ? (addressLinesCount - 4) * 5 : 0;
    const commonBoxHeight = 35 + addressOffset;

    // --- Header Boxes (Width 95 + 10 Gap + 95 = 200mm, නමුත් margin නිසා 195mm ට ගැලපේ) ---
    doc.rect(10, startY, 95, 5);
    const formattedDate1 = q.eventDate
      ? new Date(q.date).toLocaleDateString("en-US")
      : "";
    doc.text(`Date of Invoice:       ${formattedDate1}`, 11, startY + 3.5);

    doc.rect(10, startY + 8, 95, commonBoxHeight);
    doc.setFontSize(8);
    doc.text(`Supplier's TIN:         114243400`, 11, startY + 11.5);
    doc.text(
      `Supplier's Name:     Imagine Entertainment (PVT) LTD`,
      11,
      startY + 16.5,
    );
    doc.text(`Address:                   17/18 2nd Lane,`, 11, startY + 21.5);
    doc.text(`Prathibimbarama Road,`, 38, startY + 26.5);
    doc.text(`Kalubowila,`, 38, startY + 31.5);
    doc.text(`Dehiwala.`, 38, startY + 36.5);
    doc.text(
      `Telephone No:         071 868 4008 / 071 893 3514`,
      11,
      startY + commonBoxHeight + 6.5,
    );

    doc.rect(110, startY, 95, 5);
    doc.text(`Quotation No:           ${q.invoiceNo || ""}`, 111, startY + 3.5);
    doc.rect(110, startY + 8, 95, commonBoxHeight);
    doc.text(
      `Purchaser's TIN:        ${q.clientTIN || ""}`,
      111,
      startY + 11.5,
    );
    doc.text(`Purchaser's Name:    ${q.ClientName || ""}`, 111, startY + 16.5);
    doc.text("Address:", 111, startY + 21.5);
    pAddr.forEach((line, index) => {
      doc.text(
        line + (index < pAddr.length - 1 ? "," : ""),
        140,
        startY + 21.5 + index * 5,
      );
    });
    doc.text(
      `Telephone No:            ${q.clientTelephoneNumber || ""}`,
      111,
      startY +
        26.5 +
        (addressLinesCount > 0 ? (addressLinesCount - 1) * 5 : 0) +
        (addressLinesCount <= 4 ? (4 - addressLinesCount) * 5 : 0),
    );

    doc.rect(10, startY + commonBoxHeight + 11.5, 95, 5);
    let deliveryDateString = Array.isArray(q.eventDate)
      ? q.eventDate
          .filter((d) => d)
          .map((d) => new Date(d).toLocaleDateString("en-GB"))
          .join(", ")
      : "";
    doc.text(
      `Date Of Delivery:     ${deliveryDateString}`,
      11,
      startY + commonBoxHeight + 15,
    );

    doc.rect(110, startY + commonBoxHeight + 11.5, 95, 5);
    doc.text(
      `Place of Supply:         ${q.eventLocation || ""}`,
      111,
      startY + commonBoxHeight + 15,
    );

    doc.rect(10, startY + commonBoxHeight + 20, 195, 5);
    doc.text(
      `Additional Information if any: ${q.eventAdditionalInfo || ""}`,
      13,
      startY + commonBoxHeight + 23.5,
    );

    // --- Table 1: Main Reference Table (Width 195) ---
    let finalY = startY + commonBoxHeight + 28;
    autoTable(doc, {
      startY: finalY,
      head: [
        [
          "Reference",
          "Description of Goods and Services",
          "Quantity",
          "Unit Price",
          "Amount\nExcluding VAT\n(RS)",
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [173, 216, 230],
        textColor: [0, 0, 0],
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 90 }, // Description
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 }, // Total: 20+90+20+30+35 = 195mm
      },
      margin: { left: 10, right: 5 },
    });

    finalY = doc.lastAutoTable.finalY + 5;
    const categories = [
      { key: "ledSystems", label: "LED Screen System", color: [144, 238, 144] },
      { key: "lightSystems", label: "Lighting System", color: [173, 216, 230] },
      { key: "soundSystems", label: "Sound System", color: [255, 182, 193] },

      {
        key: "stageAndTruss",
        label: "Stage & Truss System",
        color: [230, 230, 250],
      },
    ];

    const categoriesOther = [
      {
        key: "powerSystems",
        label: "Power Generator",
        color: [255, 204, 203],
      },
      {
        key: "videoSystems",
        label: "Video Animation Production",
        color: [210, 180, 140],
      },
      {
        key: "technicianSystems",
        label: "Technician & Transport",
        color: [211, 211, 211],
      },
      {
        key: "otherSystems",
        label: "Other Services",
        color: [255, 218, 185],
      },
    ];
    let activeCategoryCounter = 1;
    categories.forEach((cat) => {
      // අදාළ category එකේ items තියෙනවා නම් පමණක් ඇතුළට යන්න
      if (q[cat.key] && q[cat.key].length > 0) {
        // පරීක්ෂා කරන්න: Category එකේ ඇතුළේ තියෙන sub-blocks වලත් ඇත්තටම lineItems තියෙනවද කියලා
        const hasActualItems = q[cat.key].some(
          (sub) => sub.lineItems && sub.lineItems.length > 0,
        );

        if (hasActualItems) {
          const tableRows = [];

          tableRows.push([
            {
              content: `${activeCategoryCounter}`,
              styles: {
                halign: "center",
                fontStyle: "bold",
                fillColor: cat.color,
              },
            },
            {
              content: `${cat.label}`,
              colSpan: 4,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: cat.color,
                textColor: [0, 0, 0],
              },
            },
          ]);
          let categoryTotal = 0;
          let itemGlobalCounter = 1;
          const showHeaderFor = ["ledSystems", "lightSystems", "soundSystems"];

          q[cat.key].forEach((sub, subIdx) => {
            if (sub.lineItems.length === 0) return; // items නැති sub blocks පෙන්වන්න එපා

            if (showHeaderFor.includes(cat.key)) {
              tableRows.push([
                {
                  // මෙතන index + 1 වෙනුවට activeCategoryCounter පාවිච්චි කරන්න
                  content: `        ${activeCategoryCounter}.${subIdx + 1}                ${sub.subTitle || "General"}`,
                  colSpan: 5,
                  styles: {
                    fillColor: [245, 245, 245],
                    fontStyle: "bold",
                    halign: "left",
                  },
                },
              ]);
            }
            let subItemCounter = 1;
            sub.lineItems.forEach((item, itemIdx) => {
              let displayDesc = item.desc;
              const h = item.height || 1;
              const w = item.width || 1;
              const distance = item.distance || 1;
              const days = item.days || 1;
              const qty = item.qty || 1;
              const unitPrice = item.unitPrice || 0;
              const hours = item.hours || 8;
              const cube = item.cube || 0;

              let itemTotal = 0;

              // --- 1. ගණනය කිරීම් සහ Descriptions සකස් කිරීම ---
              if (cat.key === "stageAndTruss") {
                const subTitle = (sub.subTitle || "").toLowerCase();
                if (subTitle.includes("marquee")) {
                  itemTotal = qty * unitPrice;
                } else if (
                  subTitle.includes("goalpost") ||
                  subTitle.includes("main stage") ||
                  subTitle.includes("platform")
                ) {
                  itemTotal = h * w * qty * unitPrice;
                  displayDesc = `${item.desc} (${w}' x ${h}')`;
                } else if (subTitle.includes("normal")) {
                  itemTotal = w * qty * unitPrice;
                  displayDesc = `${item.desc} (${w}' Width)`;
                } else {
                  itemTotal = qty * unitPrice;
                }
              } else if (cat.key === "powerSystems") {
                itemTotal = (unitPrice / 8) * hours * qty * days;
                displayDesc = `${item.desc} (${hours} hours) , ${qty} Qty , ${days} Days`;
              } else if (cat.key === "ledSystems") {
                const qty = Number(item.qty) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const sqPrice = Number(item.sqPrice) || 0;
                const w = Number(item.width) || 0;
                const h = Number(item.height) || 0;
                const cube = Number(item.cube) || 0;

                // Description එක සැකසීම (P4 HD Quality LED Screen...)
                const ledMatch = item.desc.match(/^(P\d+(\.\d+)?)/i);
                if (ledMatch) {
                  const ledType = ledMatch[0].toUpperCase();
                  displayDesc = `${ledType} HD Quality LED Screen`;
                  if (w > 0 && h > 0) {
                    displayDesc += ` (${w}' x ${h}') , ${qty}Qty`;
                  }
                }

                // --- ගණනය කිරීමේ logic එක ---
                // Schema එකේ තියෙන්නේ 'cube' නිසා item.cube පාවිච්චි කරන්න

                if (sub.calculationMethod === "square") {
                  // ක්‍රමය Square Feet නම්: Width * Height * Qty * SqPrice
                  itemTotal = w * h * qty * sqPrice;
                } else {
                  // ක්‍රමය Unit නම්: Cube * Qty * UnitPrice
                  // Cube අගයක් ඇතුළත් කර නැත්නම් (0 නම්) එය 1 ලෙස සලකා ගුණ කරයි
                  const multiplier = cube > 0 ? cube : 1;
                  itemTotal = multiplier * qty * unitPrice;
                }
              } else if (cat.key === "technicianSystems") {
                if (item.desc.includes("Labor")) {
                  displayDesc = `${item.desc} - ${days} Days - ${qty} LaboreQty`;
                } else if (item.desc.includes("Transport")) {
                  displayDesc = `${item.desc} - ${days} Days - ${qty} Lorries - ${distance} km`;
                }
                itemTotal = unitPrice * qty * days * distance;
              } else {
                itemTotal = qty * unitPrice;
              }

              let finalUnitPrice = "";
              if (cat.key === "videoSystems") {
                // 🟢 Video Systems සඳහා පමණක් "Rs." පෙන්වයි
                finalUnitPrice = "Rs.";
              } else {
                // අනෙක් අංශ සඳහා සාමාන්‍ය මිල පෙන්වයි
                finalUnitPrice = unitPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              }

              categoryTotal += itemTotal;
              // Reference Number සෑදීම
              let refNumber = showHeaderFor.includes(cat.key)
                ? `${activeCategoryCounter}.${subIdx + 1}.${itemIdx + 1}`
                : `${activeCategoryCounter}.${itemGlobalCounter}`;

              // --- 2. Table එකට දත්ත ඇතුළත් කිරීම (Row Construction) ---

              // LED Breakdown එකක් තිබේ නම් (All video items)
              if (cat.key === "ledSystems") {
                const qty = Number(item.qty) || 0;
                const w = Number(item.width) || 0;
                const h = Number(item.height) || 0;
                const cube = Number(item.cube) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const sqPrice = Number(item.sqPrice) || 0;

                // --- 1. Quantity එක ක්‍රමය අනුව ගණනය කිරීම (හැම Item එකකටම පොදුවේ) ---
                let totalCalculatedQty = 0;
                let priceToDisplay = 0;

                if (sub.calculationMethod === "square") {
                  totalCalculatedQty = w * h * qty; // Width * Height * Qty
                  priceToDisplay = sqPrice;
                  itemTotal = w * h * qty * sqPrice;
                  displayDesc = `${item.desc} (${w}' x ${h}') , ${qty}Qty`;
                } else {
                  const multiplier = cube > 0 ? cube : 1;
                  totalCalculatedQty = multiplier * qty; // Cube * Qty
                  priceToDisplay = unitPrice;
                  itemTotal = multiplier * qty * unitPrice;
                  displayDesc = `${item.desc} (${w}' x ${h}') , ${qty}Qty`;
                }

                // --- 2. Table එකට Rows ඇතුළත් කිරීම ---

                // All video breakdown එකක් තිබේ නම්
                if (item.desc.includes("All video")) {
                  const breakdown = [
                    "Video Mapping System With Apple I Mac",
                    "Operating System for Processors",
                    "Seamless Video Switcher",
                    "Processing Units",
                    "Video Wall Processors",
                    "Installation, Cabling & Wiring",
                    "Processing Units",
                  ];

                  breakdown.forEach((bText, bIdx) => {
                    tableRows.push([
                      `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`, // subItemCounter භාවිතා කරන්න
                      bText,
                      bIdx === 0 ? totalCalculatedQty.toLocaleString() : "",
                      bIdx === 0
                        ? priceToDisplay.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : "",
                      bIdx === 0
                        ? itemTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : "",
                    ]);
                    subItemCounter++; // breakdown එකේ හැම පේළියකටම පසු අංකය වැඩි කරන්න
                  });
                }
                // සාමාන්‍ය LED Item එකක් නම් (Breakdown නැති ඒවා)
                else {
                  tableRows.push([
                    `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`, // subItemCounter භාවිතා කරන්න
                    displayDesc,
                    totalCalculatedQty.toLocaleString(),
                    priceToDisplay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                    itemTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                  ]);
                  subItemCounter++; // අංකය වැඩි කරන්න
                }
              }
              // සාමාන්‍ය පේළි සඳහා (Technician නම් distance, නැත්නම් qty පෙන්වයි)
              // --- සාමාන්‍ය පේළි සඳහා (Technician, Power සහ අනෙකුත් අංශ) ---
              else {
                let finalCalculatedQty = "";

                if (cat.key === "technicianSystems") {
                  finalCalculatedQty = item.desc.includes("Transport")
                    ? `${(distance * days * qty).toLocaleString()}`
                    : `${(qty * days).toLocaleString()}`;
                }
                // 🟢 Power Systems සඳහා Quantity එක Days * Qty ලෙස පෙන්වීම
                else if (cat.key === "powerSystems") {
                  finalCalculatedQty = `${(days * qty).toLocaleString()}`;
                } else if (cat.key === "stageAndTruss") {
                  finalCalculatedQty = `${(w * h * qty).toLocaleString()}`;
                } else if (cat.key === "videoSystems") {
                  finalCalculatedQty = " ";
                } else {
                  finalCalculatedQty = item.qty || "";
                }

                tableRows.push([
                  refNumber,
                  displayDesc,
                  finalCalculatedQty, // ගණනය කළ Quantity එක මෙතනට වැටේ
                  finalUnitPrice,
                  `${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                  `${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                ]);
              }
              itemGlobalCounter++;
            });
          });

          // Category Total පේළිය (කලින් පරිදිම)
          tableRows.push([
            {
              content: `Total Amount for ${cat.label}`,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: cat.color,
              },
            },
            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: cat.color,
              },
            },
            {
              content: `${categoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: cat.color,
              },
            },
          ]);

          // Page Break Check
          if (finalY > 240) {
            doc.addPage();
            drawPageBorder();
            finalY = 25;
          }

          autoTable(doc, {
            startY: finalY,
            // head: [
            //   [
            //     // මෙන්න මෙතන තමයි ප්‍රධාන Category අංකය dynamic වෙන්නේ
            //     {
            //       content: `${activeCategoryCounter}`,
            //       styles: { halign: "center" },
            //     },
            //     {
            //       content: `${cat.label}`,
            //       colSpan: 4,
            //       styles: { halign: "left" },
            //     },
            //   ],
            // ],
            body: tableRows,
            // ... අනෙක් Styles කලින් පරිදිම ...
            theme: "grid",
            headStyles: {
              fillColor: cat.color,
              textColor: [0, 0, 0],
              fontStyle: "bold",
            },
            styles: {
              fontSize: 7,
              lineColor: [0, 0, 0],
              lineWidth: 0.1,
              valign: "middle",
            },
            columnStyles: {
              0: { cellWidth: 20, halign: "center", fontStyle: "bold" },
              1: { cellWidth: 90 },
              2: { cellWidth: 20, halign: "center" },
              3: { cellWidth: 30, halign: "right" },
              4: { cellWidth: 35, halign: "right" },
            },
            margin: { left: 10, right: 5 },
          });

          finalY = doc.lastAutoTable.finalY + 8;

          // මේ Category එක සාර්ථකව ඇන්ද නිසා ඊළඟ එකට අංකය 1කින් වැඩි කරනවා
          activeCategoryCounter++;
        }
      }
    });

    // --- Footer Totals (Width 195) ---
    if (finalY > 170) {
      doc.addPage();
      drawPageBorder();
      finalY = 25;
    }

    // වගුව 1, 2, 3 සඳහා cellWidths එකතුව 195 වන සේ ගැලපීම (130 + 30 + 35 = 195)
    const footerColStyles = {
      0: { cellWidth: 130 },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
    };

    autoTable(doc, {
      startY: finalY,
      body: [
        [
          "Total Amount",
          "Rs.",
          `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
        [
          "Discount / Sponsorship Amount",
          "Rs.",
          `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
        [
          "Total Value of Supply",
          "Rs.",
          `${(q.subTotal - (q.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: footerColStyles,
      margin: { left: 10 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 3,
      body: [
        [
          "VAT Amount (Total Value of Supply @ 18%)",
          "Rs.",
          `${q.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: footerColStyles,
      margin: { left: 10 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 3,
      body: [
        [
          "Total Amount including VAT",
          "Rs.",
          `${q.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: footerColStyles,
      margin: { left: 10 },
    });

    finalY = doc.lastAutoTable.finalY + 5;
    doc.rect(10, finalY - 5, 195, 8); // Width 195
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount in Words:", 13, finalY);
    doc.setFont("helvetica", "normal");
    const totalInWords = numberToWords(Math.floor(q.grandTotal));
    doc.text(`${totalInWords}`, 55, finalY);

    finalY += 12;
    doc.rect(10, finalY - 5, 195, 8); // Width 195
    doc.setFont("helvetica", "bold");
    doc.text("Mode of Payment :", 13, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(" Cheque in favour of ", 45, finalY);
    doc.setFont("helvetica", "bolditalic");
    doc.text('"Imagine Entertainment (Pvt) Ltd"', 75, finalY);

    finalY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Terms and Conditions", 10, finalY);
    doc.setFont("helvetica", "normal");
    const terms = [
      "1. Confirmation Of The Quotation Is Needed Within One Week Of The Quotation Date.",
      "2. 75% Advance Payment On Confirmation & Balance within 7 days after the event.",
      "3. If Any Additional Items Or Dates Requested By The Client Will Be Fully Charged With The Final Invoice.",
      "4. 50% Of Amount From The Total Value For The Rehearsals Will Be Charged With The Final Invoice.",
      "5. Above Given Rate Is Valid For Colombo City Limits Only.",
      "6. Send The Purchase Order 7 Days Before The Event Date.",
      "7. Power has to be provided by the client.",
    ];
    terms.forEach((term, index) => {
      doc.text(term, 15, finalY + 7 + index * 5);
    });

    finalY = finalY + 7 + terms.length * 5 + 10;
    if (finalY > 260) {
      doc.addPage();
      drawPageBorder();
      finalY = 30;
    }

    doc.text("Yours faithfully,", 10, finalY);
    doc.setFont("helvetica", "bold");
    doc.text("IMAGINE ENTERTAINMENT (PVT) LTD.", 10, finalY + 5);
    doc.text("..................................", 10, finalY + 20);
    doc.text("Sajith Kodikara", 10, finalY + 25);
    doc.setFontSize(7);
    doc.text("MANAGING DIRECTOR", 10, finalY + 29);

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`${i} / ${totalPages}`, 195, 292, { align: "right" });
    }

    doc.save(`Quotation_${q.invoiceNo}.pdf`);
  };
  const generateSummaryPDF = (q) => {
    const doc = new jsPDF();
    const headerImg = "/image/header.jpeg";

    const drawPageBorder = () => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("IMAGINE ENTERTAINMENT (PVT) LTD", 105, 292, {
        align: "center",
      });
      doc.text("QT NO: " + q.invoiceNo, 10, 292, { align: "left" });
    };

    const drawHeader = (isFirstPage) => {
      if (isFirstPage) {
        doc.addImage(headerImg, "JPEG", 30, 10, 150, 25);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.rect(65, 40.5, 80, 6);
        doc.text("QUOTATION", 105, 45, { align: "center" });
      }
    };

    drawPageBorder();
    drawHeader(true);

    let startY = 53;
    const pAddr = (q.clientAddress || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    const addressLinesCount = pAddr.length;
    const addressOffset =
      addressLinesCount > 4 ? (addressLinesCount - 4) * 5 : 0;
    const commonBoxHeight = 35 + addressOffset;

    // --- Header Boxes ---
    doc.rect(10, startY, 95, 5);
    doc.text(
      `Date of Invoice:       ${q.date ? new Date(q.date).toLocaleDateString("en-US") : ""}`,
      11,
      startY + 3.5,
    );
    doc.rect(10, startY + 8, 95, commonBoxHeight);
    doc.text(`Supplier's TIN:         114243400`, 11, startY + 11.5);
    doc.text(
      `Supplier's Name:     Imagine Entertainment (PVT) LTD`,
      11,
      startY + 16.5,
    );
    doc.text(`Address:                   17/18 2nd Lane,`, 11, startY + 21.5);
    doc.text(`Prathibimbarama Road,`, 38, startY + 26.5);
    doc.text(`Kalubowila,`, 38, startY + 31.5);
    doc.text(`Dehiwala.`, 38, startY + 36.5);
    doc.text(
      `Telephone No:         071 868 4008 / 071 893 3514`,
      11,
      startY + commonBoxHeight + 6.5,
    );

    doc.rect(110, startY, 95, 5);
    doc.text(`Quotation No:           ${q.invoiceNo || ""}`, 111, startY + 3.5);
    doc.rect(110, startY + 8, 95, commonBoxHeight);
    doc.text(
      `Purchaser's TIN:        ${q.clientTIN || ""}`,
      111,
      startY + 11.5,
    );
    doc.text(`Purchaser's Name:    ${q.ClientName || ""}`, 111, startY + 16.5);
    doc.text("Address:", 111, startY + 21.5);
    pAddr.forEach((line, index) => {
      doc.text(
        line + (index < pAddr.length - 1 ? "," : ""),
        140,
        startY + 21.5 + index * 5,
      );
    });

    doc.rect(10, startY + commonBoxHeight + 11.5, 95, 5);
    let deliveryDate = Array.isArray(q.eventDate)
      ? q.eventDate
          .filter((d) => d)
          .map((d) => new Date(d).toLocaleDateString("en-GB"))
          .join(", ")
      : "";
    doc.text(
      `Date Of Delivery:      ${deliveryDate}`,
      11,
      startY + commonBoxHeight + 15,
    );

    doc.rect(110, startY + commonBoxHeight + 11.5, 95, 5);
    doc.text(
      `Place of Supply:         ${q.eventLocation || ""}`,
      111,
      startY + commonBoxHeight + 15,
    );

    doc.rect(10, startY + commonBoxHeight + 20, 195, 5);
    doc.text(
      `Additional Information if any: ${q.eventAdditionalInfo || ""}`,
      13,
      startY + commonBoxHeight + 23.5,
    );

    // --- Main Table Head ---
    let finalY = startY + commonBoxHeight + 28;
    autoTable(doc, {
      startY: finalY,
      head: [
        [
          "Reference",
          "Description of Goods and Services",
          "Quantity",
          "Unit Price",
          "Amount\nExcluding VAT\n(RS)",
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [173, 216, 230],
        textColor: [0, 0, 0],
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 90 }, // Description
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 }, // Total: 20+90+20+30+35 = 195mm
      },
      margin: { left: 10, right: 5 },
    });

    finalY = doc.lastAutoTable.finalY + 5;

    const firstGroup = [
      { key: "ledSystems", label: "LED Screen System", color: [144, 238, 144] },
      { key: "lightSystems", label: "Lighting System", color: [173, 216, 230] },
      { key: "soundSystems", label: "Sound System", color: [255, 182, 193] },
      {
        key: "stageAndTruss",
        label: "Stage & Truss System",
        color: [230, 230, 250],
      },
    ];

    let activeCategoryCounter = 1;
    let itemGlobalCounter = 1;

    function renderCategoryTable(cat) {
      if (q[cat.key] && q[cat.key].length > 0) {
        const hasActualItems = q[cat.key].some(
          (sub) => sub.lineItems && sub.lineItems.length > 0,
        );
        if (!hasActualItems) return;

        const tableRows = [];
        let categoryTotal = 0; // Category එකේ එකතුව ගණනය කිරීමට

        // Category Header
        tableRows.push([
          {
            content: `${activeCategoryCounter}`,
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: cat.color,
            },
          },
          {
            content: `${cat.label}`,
            colSpan: 4,
            styles: { halign: "left", fontStyle: "bold", fillColor: cat.color },
          },
        ]);

        const showHeaderFor = ["ledSystems", "lightSystems", "soundSystems"];

        q[cat.key].forEach((sub, subIdx) => {
          if (sub.lineItems.length === 0) return;
          if (showHeaderFor.includes(cat.key)) {
            tableRows.push([
              {
                // මෙතන index + 1 වෙනුවට activeCategoryCounter පාවිච්චි කරන්න
                content: `        ${activeCategoryCounter}.${subIdx + 1}                ${sub.subTitle || "General"}`,
                colSpan: 5,
                styles: {
                  fillColor: [245, 245, 245],
                  fontStyle: "bold",
                  halign: "left",
                },
              },
            ]);
          }
          let subItemCounter = 1;
          sub.lineItems.forEach((item, itemIdx) => {
            let displayDesc = item.desc;
            const h = item.height || 1;
            const w = item.width || 1;
            const distance = item.distance || 1;
            const days = item.days || 1;
            const qty = item.qty || 1;
            const unitPrice = item.unitPrice || 0;
            const hours = item.hours || 8;
            const cube = item.cube || 0;

            let itemTotal = 0;

            // --- 1. ගණනය කිරීම් සහ Descriptions සකස් කිරීම ---
            if (cat.key === "stageAndTruss") {
              const subTitle = (sub.subTitle || "").toLowerCase();
              if (subTitle.includes("marquee")) {
                itemTotal = qty * unitPrice;
              } else if (
                subTitle.includes("goalpost") ||
                subTitle.includes("main stage") ||
                subTitle.includes("platform")
              ) {
                itemTotal = h * w * qty * unitPrice;
                displayDesc = `${item.desc} (${w}' x ${h}')`;
              } else if (subTitle.includes("normal")) {
                itemTotal = w * qty * unitPrice;
                displayDesc = `${item.desc} (${w}' Width)`;
              } else {
                itemTotal = qty * unitPrice;
              }
            } else if (cat.key === "powerSystems") {
              itemTotal = (unitPrice / 8) * hours * qty * days;
              displayDesc = `${item.desc} (${hours} hours) , ${qty} Qty , ${days} Days`;
            } else if (cat.key === "ledSystems") {
              const qty = Number(item.qty) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const sqPrice = Number(item.sqPrice) || 0;
              const w = Number(item.width) || 0;
              const h = Number(item.height) || 0;
              const cube = Number(item.cube) || 0;

              // Description එක සැකසීම (P4 HD Quality LED Screen...)
              const ledMatch = item.desc.match(/^(P\d+(\.\d+)?)/i);
              if (ledMatch) {
                const ledType = ledMatch[0].toUpperCase();
                displayDesc = `${ledType} HD Quality LED Screen`;
                if (w > 0 && h > 0) {
                  displayDesc += ` (${w}' x ${h}') , ${qty}Qty`;
                }
              }

              // --- ගණනය කිරීමේ logic එක ---
              // Schema එකේ තියෙන්නේ 'cube' නිසා item.cube පාවිච්චි කරන්න

              if (sub.calculationMethod === "square") {
                // ක්‍රමය Square Feet නම්: Width * Height * Qty * SqPrice
                itemTotal = w * h * qty * sqPrice;
              } else {
                // ක්‍රමය Unit නම්: Cube * Qty * UnitPrice
                // Cube අගයක් ඇතුළත් කර නැත්නම් (0 නම්) එය 1 ලෙස සලකා ගුණ කරයි
                const multiplier = cube > 0 ? cube : 1;
                itemTotal = multiplier * qty * unitPrice;
              }
            } else if (cat.key === "technicianSystems") {
              if (item.desc.includes("Labor")) {
                displayDesc = `${item.desc} - ${days} Days - ${qty} LaboreQty`;
              } else if (item.desc.includes("Transport")) {
                displayDesc = `${item.desc} - ${days} Days - ${qty} Lorries - ${distance} km`;
              }
              itemTotal = unitPrice * qty * days * distance;
            } else {
              itemTotal = qty * unitPrice;
            }

            let finalUnitPrice = "";
            if (cat.key === "videoSystems") {
              // 🟢 Video Systems සඳහා පමණක් "Rs." පෙන්වයි
              finalUnitPrice = "Rs.";
            } else {
              // අනෙක් අංශ සඳහා සාමාන්‍ය මිල පෙන්වයි
              finalUnitPrice = unitPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              });
            }

            categoryTotal += itemTotal;
            // Reference Number සෑදීම
            let refNumber = showHeaderFor.includes(cat.key)
              ? `${activeCategoryCounter}.${subIdx + 1}.${itemIdx + 1}`
              : `${activeCategoryCounter}.${itemGlobalCounter}`;

            // --- 2. Table එකට දත්ත ඇතුළත් කිරීම (Row Construction) ---

            // LED Breakdown එකක් තිබේ නම් (All video items)
            if (cat.key === "ledSystems") {
              const qty = Number(item.qty) || 0;
              const w = Number(item.width) || 0;
              const h = Number(item.height) || 0;
              const cube = Number(item.cube) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const sqPrice = Number(item.sqPrice) || 0;

              // --- 1. Quantity එක ක්‍රමය අනුව ගණනය කිරීම (හැම Item එකකටම පොදුවේ) ---
              let totalCalculatedQty = 0;
              let priceToDisplay = 0;

              if (sub.calculationMethod === "square") {
                totalCalculatedQty = w * h * qty; // Width * Height * Qty
                priceToDisplay = sqPrice;
                itemTotal = w * h * qty * sqPrice;
                displayDesc = `${item.desc} (${w}' x ${h}') , ${qty}Qty`;
              } else {
                const multiplier = cube > 0 ? cube : 1;
                totalCalculatedQty = multiplier * qty; // Cube * Qty
                priceToDisplay = unitPrice;
                itemTotal = multiplier * qty * unitPrice;
                displayDesc = `${item.desc} (${w}' x ${h}') , ${qty}Qty`;
              }

              // --- 2. Table එකට Rows ඇතුළත් කිරීම ---

              // All video breakdown එකක් තිබේ නම්
              if (item.desc.includes("All video")) {
                const breakdown = [
                  "Video Mapping System With Apple I Mac",
                  "Operating System for Processors",
                  "Seamless Video Switcher",
                  "Processing Units",
                  "Video Wall Processors",
                  "Installation, Cabling & Wiring",
                  "Processing Units",
                ];

                breakdown.forEach((bText, bIdx) => {
                  tableRows.push([
                    `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`, // subItemCounter භාවිතා කරන්න
                    bText,
                    bIdx === 0 ? totalCalculatedQty.toLocaleString() : "",
                    bIdx === 0
                      ? priceToDisplay.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      : "",
                    bIdx === 0
                      ? itemTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      : "",
                  ]);
                  subItemCounter++; // breakdown එකේ හැම පේළියකටම පසු අංකය වැඩි කරන්න
                });
              }
              // සාමාන්‍ය LED Item එකක් නම් (Breakdown නැති ඒවා)
              else {
                // සාමාන්‍ය item එකක් නම්
                tableRows.push([
                  `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`, // subItemCounter භාවිතා කරන්න
                  displayDesc,
                  totalCalculatedQty.toLocaleString(),
                  priceToDisplay.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  }),
                  itemTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  }),
                ]);
                subItemCounter++; // අංකය වැඩි කරන්න
              }
            }
            // සාමාන්‍ය පේළි සඳහා (Technician නම් distance, නැත්නම් qty පෙන්වයි)
            // --- සාමාන්‍ය පේළි සඳහා (Technician, Power සහ අනෙකුත් අංශ) ---
            else {
              let finalCalculatedQty = "";

              if (cat.key === "technicianSystems") {
                finalCalculatedQty = item.desc.includes("Transport")
                  ? `${(distance * days * qty).toLocaleString()}`
                  : `${(qty * days).toLocaleString()}`;
              }
              // 🟢 Power Systems සඳහා Quantity එක Days * Qty ලෙස පෙන්වීම
              else if (cat.key === "powerSystems") {
                finalCalculatedQty = `${(days * qty).toLocaleString()}`;
              } else if (cat.key === "stageAndTruss") {
                finalCalculatedQty = `${(w * h * qty).toLocaleString()}`;
              } else if (cat.key === "videoSystems") {
                finalCalculatedQty = " ";
              } else {
                finalCalculatedQty = item.qty || "";
              }

              tableRows.push([
                refNumber,
                displayDesc,
                finalCalculatedQty, // ගණනය කළ Quantity එක මෙතනට වැටේ
                finalUnitPrice,
                `${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                `${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              ]);
            }
            itemGlobalCounter++;
          });
        });

        // --- 🟢 මෙන්න ඔබ ඉල්ලූ "Total Amount for Category" පේළිය ---
        tableRows.push([
          {
            content: `Total Amount for ${cat.label}`,
            colSpan: 3,
            styles: { halign: "left", fontStyle: "bold", fillColor: cat.color },
          },
          {
            content: `Rs.`,
            styles: {
              halign: "right",
              fontStyle: "bold",
              fillColor: cat.color,
            },
          },
          {
            content: categoryTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
            styles: {
              halign: "right",
              fontStyle: "bold",
              fillColor: cat.color,
            },
          },
        ]);

        autoTable(doc, {
          startY: finalY,
          body: tableRows,
          theme: "grid",
          styles: {
            fontSize: 7,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 20, halign: "center" },
            1: { cellWidth: 90 },
            2: { cellWidth: 20, halign: "center" },
            3: { cellWidth: 30, halign: "right" },
            4: { cellWidth: 35, halign: "right" },
          },
          margin: { left: 10 },
        });

        finalY = doc.lastAutoTable.finalY + 8;
        activeCategoryCounter++;
        if (finalY > 240) {
          doc.addPage();
          drawPageBorder();
          finalY = 25;
        }
      }
    }

    // පළමු කාණ්ඩය (LED to Stage)
    firstGroup.forEach((cat) => renderCategoryTable(cat));

    // --- මැදට එන BREAKDOWN වගුව ---
    const ledSummary = q.summaryDetails.find((d) => d.categoryId === "led");
    if (ledSummary && ledSummary.row) {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            {
              content: `SUMMARY BREAKDOWN (LED, LIGHT, SOUND, STAGE) SYSTEMS`,
              colSpan: 5,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
          ...ledSummary.row.map((r, idx) => [
            {
              content: `${idx + 1}`, // මෙතනට 1, 2, 3 ලෙස අංකය වැටේ
              styles: { halign: "center" },
            },
            ` ${r.discountPercent}% ${r.rowType} `,
            "",
            {
              content: `Rs.`, // මෙතනට 1, 2, 3 ලෙස අංකය වැටේ
              styles: { halign: "right" },
            },
            {
              content: r.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { fontStyle: "bold", halign: "right" },
            },
          ]),
          [
            {
              content: `Total Amount for Reheirsal day and Event days.`,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },

            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              content: ledSummary.categoryFinalTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
          [
            {
              content: `Less: special Discount.`,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },

            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              content: ledSummary.categoryFinalTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
          [
            {
              content: `After Discount Amount `,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },

            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              content: ledSummary.categoryFinalTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
        ],
        theme: "grid",
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 90 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
        },
        margin: { left: 10 },
      });
      finalY = doc.lastAutoTable.finalY + 10;
    }

    // දෙවන කාණ්ඩය (Power to Others)

    // --- Power Systems Section ---
    const pSystems = [
      { key: "powerSystems", label: "Power Generator", color: [255, 204, 203] },
    ];

    pSystems.forEach((cat) => renderCategoryTable(cat));

    // Summary Details වලින් නිවැරදි ID එක සොයා ගැනීම
    const powerSumData = q.summaryDetails?.find(
      (d) => d.categoryId === "power",
    );

    // දත්ත තිබේදැයි පරීක්ෂා කර වගුව ඇඳීම
    if (powerSumData && powerSumData.row) {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            {
              content: `SUMMARY BREAKDOWN FOR POWER GENERATOR `,
              colSpan: 5,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
          ...powerSumData.row.map((r, idx) => [
            { content: `${idx + 1}`, styles: { halign: "center" } },
            `${r.discountPercent}%  ${r.rowType} `,
            "",
            { content: `Rs.`, styles: { halign: "right" } },
            {
              content: (r.amount || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { fontStyle: "bold", halign: "right" },
            },
          ]),
          [
            {
              content: `Total Amount for Reheirsal day and Event days.`,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              // 🟢 මෙන්න මෙතන තමයි Error එක එන්න පුළුවන් තැන - Safe access දමා ඇත
              content: (powerSumData.categoryFinalTotal || 0).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                },
              ),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
        ],
        theme: "grid",
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 90 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
        },
        margin: { left: 10 },
      });
      finalY = doc.lastAutoTable.finalY + 10;
    }

    // --- Power Systems Section ---
    const vSystems = [
      {
        key: "videoSystems",
        label: "Video Animation Production",
        color: [255, 204, 203],
      },
    ];

    vSystems.forEach((cat) => renderCategoryTable(cat));

    // Summary Details වලින් නිවැරදි ID එක සොයා ගැනීම
    const videoSumData = q.summaryDetails?.find(
      (d) => d.categoryId === "video",
    );

    // දත්ත තිබේදැයි පරීක්ෂා කර වගුව ඇඳීම
    if (videoSumData && videoSumData.row) {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            {
              content: `SUMMARY BREAKDOWN FOR VIDEO ANIMATION SYSTEM`,
              colSpan: 5,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
          ...videoSumData.row.map((r, idx) => [
            { content: `${idx + 1}`, styles: { halign: "center" } },
            `${r.discountPercent}%  ${r.rowType}  `,
            "",
            { content: `Rs.`, styles: { halign: "right" } },
            {
              content: (r.amount || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { fontStyle: "bold", halign: "right" },
            },
          ]),
          [
            {
              content: `Total Amount for Reheirsal day and Event days.`,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              // 🟢 මෙන්න මෙතන තමයි Error එක එන්න පුළුවන් තැන - Safe access දමා ඇත
              content: (videoSumData.categoryFinalTotal || 0).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                },
              ),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
        ],
        theme: "grid",
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 90 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
        },
        margin: { left: 10 },
      });
      finalY = doc.lastAutoTable.finalY + 10;
    }

    const TSystems = [
      {
        key: "technicianSystems",
        label: "Technician & Transport",
        color: [255, 204, 203],
      },
    ];

    TSystems.forEach((cat) => renderCategoryTable(cat));

    // Summary Details වලින් නිවැරදි ID එක සොයා ගැනීම
    const technicianSumData = q.summaryDetails?.find(
      (d) => d.categoryId === "tech",
    );

    // දත්ත තිබේදැයි පරීක්ෂා කර වගුව ඇඳීම
    if (technicianSumData && technicianSumData.row) {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            {
              content: `SUMMARY BREAKDOWN FOR Technician & Transport`,
              colSpan: 5,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
          ...technicianSumData.row.map((r, idx) => [
            { content: `${idx + 1}`, styles: { halign: "center" } },
            `${r.discountPercent}%  ${r.rowType}  `,
            "",
            { content: `Rs.`, styles: { halign: "right" } },
            {
              content: (r.amount || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { fontStyle: "bold", halign: "right" },
            },
          ]),
          [
            {
              content: `Total Amount for Reheirsal day and Event days.`,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              // 🟢 මෙන්න මෙතන තමයි Error එක එන්න පුළුවන් තැන - Safe access දමා ඇත
              content: (
                technicianSumData.categoryFinalTotal || 0
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
        ],
        theme: "grid",
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 90 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
        },
        margin: { left: 10 },
      });
      finalY = doc.lastAutoTable.finalY + 10;
    }

    const OSystems = [
      {
        key: "otherSystems",
        label: "other Systems",
        color: [255, 204, 203],
      },
    ];

    OSystems.forEach((cat) => renderCategoryTable(cat));

    // Summary Details වලින් නිවැරදි ID එක සොයා ගැනීම
    const otherSumData = q.summaryDetails?.find(
      (d) => d.categoryId === "other",
    );

    // දත්ත තිබේදැයි පරීක්ෂා කර වගුව ඇඳීම
    if (otherSumData && otherSumData.row) {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            {
              content: `SUMMARY BREAKDOWN FOR OTHER SYSTEM`,
              colSpan: 5,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
          ...otherSumData.row.map((r, idx) => [
            { content: `${idx + 1}`, styles: { halign: "center" } },
            `${r.discountPercent}% for ${r.rowType} `,
            "",
            { content: `Rs.`, styles: { halign: "right" } },
            {
              content: (r.amount || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { fontStyle: "bold", halign: "right" },
            },
          ]),
          [
            {
              content: `Total Amount for Reheirsal day and Event days.`,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
            {
              // 🟢 මෙන්න මෙතන තමයි Error එක එන්න පුළුවන් තැන - Safe access දමා ඇත
              content: (otherSumData.categoryFinalTotal || 0).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                },
              ),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
        ],
        theme: "grid",
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 90 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
        },
        margin: { left: 10 },
      });
      finalY = doc.lastAutoTable.finalY + 10;
    }

    if (finalY > 170) {
      doc.addPage();
      drawPageBorder();
      finalY = 25;
    }

    // වගුව 1, 2, 3 සඳහා cellWidths එකතුව 195 වන සේ ගැලපීම (130 + 30 + 35 = 195)
    const footerColStyles = {
      0: { cellWidth: 130 },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
    };

    autoTable(doc, {
      startY: finalY,
      body: [
        [
          "Total Amount",
          "Rs.",
          `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
        [
          "Discount / Sponsorship Amount",
          "Rs.",
          `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
        [
          "Total Value of Supply",
          "Rs.",
          `${(q.subTotal - (q.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: footerColStyles,
      margin: { left: 10 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 3,
      body: [
        [
          "VAT Amount (Total Value of Supply @ 18%)",
          "Rs.",
          `${q.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: footerColStyles,
      margin: { left: 10 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 3,
      body: [
        [
          "Total Amount including VAT",
          "Rs.",
          `${q.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: footerColStyles,
      margin: { left: 10 },
    });

    finalY = doc.lastAutoTable.finalY + 5;
    doc.rect(10, finalY - 5, 195, 8); // Width 195
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount in Words:", 13, finalY);
    doc.setFont("helvetica", "normal");
    const totalInWords = numberToWords(Math.floor(q.grandTotal));
    doc.text(`${totalInWords}`, 55, finalY);

    finalY += 12;
    doc.rect(10, finalY - 5, 195, 8); // Width 195
    doc.setFont("helvetica", "bold");
    doc.text("Mode of Payment :", 13, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(" Cheque in favour of ", 45, finalY);
    doc.setFont("helvetica", "bolditalic");
    doc.text('"Imagine Entertainment (Pvt) Ltd"', 75, finalY);

    finalY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Terms and Conditions", 10, finalY);
    doc.setFont("helvetica", "normal");
    const terms = [
      "1. Confirmation Of The Quotation Is Needed Within One Week Of The Quotation Date.",
      "2. 75% Advance Payment On Confirmation & Balance within 7 days after the event.",
      "3. If Any Additional Items Or Dates Requested By The Client Will Be Fully Charged With The Final Invoice.",
      "4. 50% Of Amount From The Total Value For The Rehearsals Will Be Charged With The Final Invoice.",
      "5. Above Given Rate Is Valid For Colombo City Limits Only.",
      "6. Send The Purchase Order 7 Days Before The Event Date.",
      "7. Power has to be provided by the client.",
    ];
    terms.forEach((term, index) => {
      doc.text(term, 15, finalY + 7 + index * 5);
    });

    finalY = finalY + 7 + terms.length * 5 + 10;
    if (finalY > 260) {
      doc.addPage();
      drawPageBorder();
      finalY = 30;
    }

    doc.text("Yours faithfully,", 10, finalY);
    doc.setFont("helvetica", "bold");
    doc.text("IMAGINE ENTERTAINMENT (PVT) LTD.", 10, finalY + 5);
    doc.text("..................................", 10, finalY + 20);
    doc.text("Sajith Kodikara", 10, finalY + 25);
    doc.setFontSize(7);
    doc.text("MANAGING DIRECTOR", 10, finalY + 29);

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`${i} / ${totalPages}`, 195, 292, { align: "right" });
    }

    doc.save(`Quotation_Summary_${q.invoiceNo}.pdf`);
  };
  return (
    <div className="dashboard-container">
      <h2>Quotation List</h2>
      <table className="db-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>QT NO</th>
            <th>Client Name</th>
            <th>Company Name</th>
            <th>Location</th>
            <th>Action</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(quotations) && quotations.length > 0 ? (
            quotations.map((q) => (
              <tr key={q._id} onClick={() => openEditModal(q)}>
                <td>{q.date}</td>
                <td>{q.invoiceNo}</td>
                <td>{q.ClientName}</td>
                <td>{q.clientPosition}</td>
                <td>{q.companyName}</td>
                <td>
                  <button className="btn-edit">go invoice</button>
                </td>
                <td>
                  <button
                    className="btn-download"
                    onClick={(e) => {
                      e.stopPropagation();
                      generatePDF(q);
                    }}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No quotations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <h3>Update Quotation: {selectedQuote.invoiceNo}</h3>
            <div className="modal-scroll-area">
              <div className="modal-section">
                <h4>General Information</h4>
                <div className="modal-form">
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Quotation Date:</label>
                      <input
                        type="date"
                        name="date"
                        value={selectedQuote.date}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Event Date:</label>
                      <input
                        type="date"
                        name="eventDate"
                        value={selectedQuote.eventDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid-2">
                    <input
                      placeholder="Client Name"
                      name="ClientName"
                      value={selectedQuote.ClientName}
                      onChange={handleInputChange}
                    />
                    <input
                      placeholder="Client TIN"
                      name="clientTIN"
                      value={selectedQuote.clientTIN}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid-2">
                    <input
                      placeholder="Designation"
                      name="clientPosition"
                      value={selectedQuote.clientPosition}
                      onChange={handleInputChange}
                    />
                    <input
                      placeholder="Company Name"
                      name="companyName"
                      value={selectedQuote.companyName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <textarea
                    placeholder="Address"
                    name="clientAddress"
                    value={selectedQuote.clientAddress}
                    onChange={handleInputChange}
                    rows="2"
                  />
                  <div className="grid-2">
                    <input
                      placeholder="Telephone"
                      name="clientTelephoneNumber"
                      value={selectedQuote.clientTelephoneNumber}
                      onChange={handleInputChange}
                    />
                    <input
                      placeholder="Location"
                      name="eventLocation"
                      value={selectedQuote.eventLocation}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <hr />
              <div className="systems-edit-area">
                {[
                  "ledSystems",
                  "lightSystems",
                  "soundSystems",
                  "powerSystems",
                  "stageSystems",
                  "videoSystems",
                  "technicianSystems",
                  "otherSystems",
                ].map((catKey) => (
                  <div key={catKey} className="modal-category-box">
                    <div className="modal-cat-header">
                      <h4>{catKey.toUpperCase()}</h4>
                      <button
                        className="btn-add-sub-small"
                        onClick={() => addSubCategoryInModal(catKey)}
                      >
                        + Add Sub
                      </button>
                    </div>
                    {selectedQuote[catKey].map((sub, subIdx) => (
                      <div key={subIdx} className="modal-sub-box">
                        <input
                          value={sub.subTitle}
                          onChange={(e) => {
                            const updated = [...selectedQuote[catKey]];
                            updated[subIdx].subTitle = e.target.value;
                            setSelectedQuote({
                              ...selectedQuote,
                              [catKey]: updated,
                            });
                          }}
                        />
                        {sub.lineItems.map((item, itemIdx) => (
                          <div key={itemIdx} className="modal-item-row">
                            <input
                              value={item.desc}
                              onChange={(e) => {
                                const updated = [...selectedQuote[catKey]];
                                updated[subIdx].lineItems[itemIdx].desc =
                                  e.target.value;
                                setSelectedQuote({
                                  ...selectedQuote,
                                  [catKey]: updated,
                                });
                              }}
                            />
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => {
                                const updated = [...selectedQuote[catKey]];
                                updated[subIdx].lineItems[itemIdx].qty = Number(
                                  e.target.value,
                                );
                                setSelectedQuote({
                                  ...selectedQuote,
                                  [catKey]: updated,
                                });
                              }}
                            />
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const updated = [...selectedQuote[catKey]];
                                updated[subIdx].lineItems[itemIdx].unitPrice =
                                  Number(e.target.value);
                                setSelectedQuote({
                                  ...selectedQuote,
                                  [catKey]: updated,
                                });
                              }}
                            />
                          </div>
                        ))}
                        <button
                          className="btn-add-item-small"
                          onClick={() => addLineItemInModal(catKey, subIdx)}
                        >
                          + Item
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-update" onClick={handleUpdate}>
                Save Changes
              </button>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










function renderCategoryTable(cat) {
      if (q[cat.key] && q[cat.key].length > 0) {
        const hasActualItems = q[cat.key].some(
          (sub) => sub.lineItems && sub.lineItems.length > 0,
        );
        if (!hasActualItems) return;

        const tableRows = [];
        let categoryTotal = 0; // Category එකේ එකතුව ගණනය කිරීමට

        // Category Header
        tableRows.push([
          {
            content: `${activeCategoryCounter}`,
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: cat.color,
            },
          },
          {
            content: `${cat.label}`,
            colSpan: 4,
            styles: { halign: "left", fontStyle: "bold", fillColor: cat.color },
          },
        ]);

        const showHeaderFor = ["ledSystems", "lightSystems", "soundSystems"];

        q[cat.key].forEach((sub, subIdx) => {
          if (sub.lineItems.length === 0) return;
          if (showHeaderFor.includes(cat.key)) {
            tableRows.push([
              {
                // මෙතන index + 1 වෙනුවට activeCategoryCounter පාවිච්චි කරන්න
                content: `        ${activeCategoryCounter}.${subIdx + 1}                ${sub.subTitle || "General"}`,
                colSpan: 5,
                styles: {
                  fillColor: [245, 245, 245],
                  fontStyle: "bold",
                  halign: "left",
                },
              },
            ]);
          }
          let subItemCounter = 1;
          sub.lineItems.forEach((item, itemIdx) => {
            let displayDesc = item.desc;
            const h = item.height || 1;
            const w = item.width || 1;
            const distance = item.distance || 1;
            const days = item.days || 1;
            const qty = item.qty || 1;
            const unitPrice = item.unitPrice || 0;
            const hours = item.hours || 8;
            const cube = item.cube || 0;

            let itemTotal = 0;

            // --- 1. ගණනය කිරීම් සහ Descriptions සකස් කිරීම ---
            if (cat.key === "stageAndTruss") {
              const subTitle = (sub.subTitle || "").toLowerCase();
              if (subTitle.includes("marquee")) {
                itemTotal = qty * unitPrice;
              } else if (
                subTitle.includes("goalpost") ||
                subTitle.includes("main stage") ||
                subTitle.includes("platform")
              ) {
                itemTotal = h * w * qty * unitPrice;
                displayDesc = `${item.desc} (${w}' x ${h}')`;
              } else if (subTitle.includes("normal")) {
                itemTotal = w * qty * unitPrice;
                displayDesc = `${item.desc} (${w}' Width)`;
              } else {
                itemTotal = qty * unitPrice;
              }
            } else if (cat.key === "powerSystems") {
              itemTotal = (unitPrice / 8) * hours * qty * days;
              displayDesc = `${item.desc} (${hours} hours) , ${qty} Qty , ${days} Days`;
            } else if (cat.key === "ledSystems") {
              const qty = Number(item.qty) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const sqPrice = Number(item.sqPrice) || 0;
              const w = Number(item.width) || 0;
              const h = Number(item.height) || 0;
              const cube = Number(item.cube) || 0;

              // Description එක සැකසීම (P4 HD Quality LED Screen...)
              const ledMatch = item.desc.match(/^(P\d+(\.\d+)?)/i);
              if (ledMatch) {
                const ledType = ledMatch[0].toUpperCase();
                displayDesc = `${ledType} HD Quality LED Screen`;
                if (w > 0 && h > 0) {
                  displayDesc += ` (${w}' x ${h}') , ${qty}Qty`;
                }
              }

              // --- ගණනය කිරීමේ logic එක ---
              // Schema එකේ තියෙන්නේ 'cube' නිසා item.cube පාවිච්චි කරන්න

              if (sub.calculationMethod === "square") {
                // ක්‍රමය Square Feet නම්: Width * Height * Qty * SqPrice
                itemTotal = w * h * qty * sqPrice;
              } else {
                // ක්‍රමය Unit නම්: Cube * Qty * UnitPrice
                // Cube අගයක් ඇතුළත් කර නැත්නම් (0 නම්) එය 1 ලෙස සලකා ගුණ කරයි
                const multiplier = cube > 0 ? cube : 1;
                itemTotal = multiplier * qty * unitPrice;
              }
            } else if (cat.key === "technicianSystems") {
              if (item.desc.includes("Labor")) {
                displayDesc = `${item.desc} - ${days} Days - ${qty} LaboreQty`;
              } else if (item.desc.includes("Transport")) {
                displayDesc = `${item.desc} - ${days} Days - ${qty} Lorries - ${distance} km`;
              }
              itemTotal = unitPrice * qty * days * distance;
            } else {
              itemTotal = qty * unitPrice;
            }

            let finalUnitPrice = "";
            if (cat.key === "videoSystems") {
              // 🟢 Video Systems සඳහා පමණක් "Rs." පෙන්වයි
              finalUnitPrice = "Rs.";
            } else {
              // අනෙක් අංශ සඳහා සාමාන්‍ය මිල පෙන්වයි
              finalUnitPrice = unitPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              });
            }

            categoryTotal += itemTotal;
            // Reference Number සෑදීම
            let refNumber = showHeaderFor.includes(cat.key)
              ? `${activeCategoryCounter}.${subIdx + 1}.${itemIdx + 1}`
              : `${activeCategoryCounter}.${itemGlobalCounter}`;

            // --- 2. Table එකට දත්ත ඇතුළත් කිරීම (Row Construction) ---

            // LED Breakdown එකක් තිබේ නම් (All video items)
            if (cat.key === "ledSystems") {
              const qty = Number(item.qty) || 0;
              const w = Number(item.width) || 0;
              const h = Number(item.height) || 0;
              const cube = Number(item.cube) || 0;
              const unitPrice = Number(item.unitPrice) || 0;
              const sqPrice = Number(item.sqPrice) || 0;

              // --- 1. Quantity එක ක්‍රමය අනුව ගණනය කිරීම (හැම Item එකකටම පොදුවේ) ---
              let totalCalculatedQty = 0;
              let priceToDisplay = 0;

              if (sub.calculationMethod === "square") {
                totalCalculatedQty = w * h * qty; // Width * Height * Qty
                priceToDisplay = sqPrice;
                itemTotal = w * h * qty * sqPrice;
                displayDesc = `${item.desc} (${w}' x ${h}') , ${qty}Qty`;
              } else {
                const multiplier = cube > 0 ? cube : 1;
                totalCalculatedQty = multiplier * qty; // Cube * Qty
                priceToDisplay = unitPrice;
                itemTotal = multiplier * qty * unitPrice;
                displayDesc = `${item.desc} (${w}' x ${h}') , ${qty}Qty`;
              }

              // --- 2. Table එකට Rows ඇතුළත් කිරීම ---

              // All video breakdown එකක් තිබේ නම්
              if (item.desc.includes("All video")) {
                const breakdown = [
                  "Video Mapping System With Apple I Mac",
                  "Operating System for Processors",
                  "Seamless Video Switcher",
                  "Processing Units",
                  "Video Wall Processors",
                  "Installation, Cabling & Wiring",
                  "Processing Units",
                ];

                breakdown.forEach((bText, bIdx) => {
                  tableRows.push([
                    `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`, // subItemCounter භාවිතා කරන්න
                    bText,
                    bIdx === 0 ? totalCalculatedQty.toLocaleString() : "",
                    bIdx === 0
                      ? priceToDisplay.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      : "",
                    bIdx === 0
                      ? itemTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      : "",
                  ]);
                  subItemCounter++; // breakdown එකේ හැම පේළියකටම පසු අංකය වැඩි කරන්න
                });
              }
              // සාමාන්‍ය LED Item එකක් නම් (Breakdown නැති ඒවා)
              else {
                // සාමාන්‍ය item එකක් නම්
                tableRows.push([
                  `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`, // subItemCounter භාවිතා කරන්න
                  displayDesc,
                  totalCalculatedQty.toLocaleString(),
                  priceToDisplay.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  }),
                  itemTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  }),
                ]);
                subItemCounter++; // අංකය වැඩි කරන්න
              }
            }
            // සාමාන්‍ය පේළි සඳහා (Technician නම් distance, නැත්නම් qty පෙන්වයි)
            // --- සාමාන්‍ය පේළි සඳහා (Technician, Power සහ අනෙකුත් අංශ) ---
            else {
              let finalCalculatedQty = "";

              if (cat.key === "technicianSystems") {
                finalCalculatedQty = item.desc.includes("Transport")
                  ? `${(distance * days * qty).toLocaleString()}`
                  : `${(qty * days).toLocaleString()}`;
              }
              // 🟢 Power Systems සඳහා Quantity එක Days * Qty ලෙස පෙන්වීම
              else if (cat.key === "powerSystems") {
                finalCalculatedQty = `${(days * qty).toLocaleString()}`;
              } else if (cat.key === "stageAndTruss") {
                finalCalculatedQty = `${(w * h * qty).toLocaleString()}`;
              } else if (cat.key === "videoSystems") {
                finalCalculatedQty = " ";
              } else {
                finalCalculatedQty = item.qty || "";
              }

              tableRows.push([
                refNumber,
                displayDesc,
                finalCalculatedQty, // ගණනය කළ Quantity එක මෙතනට වැටේ
                finalUnitPrice,
                `${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                `${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              ]);
            }
            itemGlobalCounter++;
          });
        });

        // --- 🟢 මෙන්න ඔබ ඉල්ලූ "Total Amount for Category" පේළිය ---
        tableRows.push([
          {
            content: `Total Amount for ${cat.label}`,
            colSpan: 3,
            styles: { halign: "left", fontStyle: "bold", fillColor: cat.color },
          },
          {
            content: `Rs.`,
            styles: {
              halign: "right",
              fontStyle: "bold",
              fillColor: cat.color,
            },
          },
          {
            content: categoryTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
            styles: {
              halign: "right",
              fontStyle: "bold",
              fillColor: cat.color,
            },
          },
        ]);

        autoTable(doc, {
          startY: finalY,
          body: tableRows,
          theme: "grid",
          styles: {
            fontSize: 7,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 20, halign: "center" },
            1: { cellWidth: 90 },
            2: { cellWidth: 20, halign: "center" },
            3: { cellWidth: 30, halign: "right" },
            4: { cellWidth: 35, halign: "right" },
          },
          margin: { left: 10 },
        });

        finalY = doc.lastAutoTable.finalY + 8;
        activeCategoryCounter++;
        if (finalY > 240) {
          doc.addPage();
          drawPageBorder();
          finalY = 25;
        }
      }
    }






/// old code 
categories.forEach((cat) => {
      // අදාළ category එකේ items තියෙනවා නම් පමණක් ඇතුළට යන්න
      if (q[cat.key] && q[cat.key].length > 0) {
        // පරීක්ෂා කරන්න: Category එකේ ඇතුළේ තියෙන sub-blocks වලත් ඇත්තටම lineItems තියෙනවද කියලා
        const hasActualItems = q[cat.key].some(
          (sub) => sub.lineItems && sub.lineItems.length > 0,
        );

        if (hasActualItems) {
          const tableRows = [];

          tableRows.push([
            {
              content: `${activeCategoryCounter}`,
              styles: {
                halign: "center",
                fontStyle: "bold",
                fillColor: cat.color,
              },
            },
            {
              content: `${cat.label}`,
              colSpan: 4,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: cat.color,
                textColor: [0, 0, 0],
              },
            },
          ]);
          let categoryTotal = 0;
          let itemGlobalCounter = 1;
          const showHeaderFor = ["ledSystems", "lightSystems", "soundSystems"];

          q[cat.key].forEach((sub, subIdx) => {
            if (sub.lineItems.length === 0) return; // items නැති sub blocks පෙන්වන්න එපා

            if (showHeaderFor.includes(cat.key)) {
              tableRows.push([
                {
                  // මෙතන index + 1 වෙනුවට activeCategoryCounter පාවිච්චි කරන්න
                  content: `        ${activeCategoryCounter}.${subIdx + 1}                ${sub.subTitle || "General"}`,
                  colSpan: 5,
                  styles: {
                    fillColor: [245, 245, 245],
                    fontStyle: "bold",
                    halign: "left",
                  },
                },
              ]);
            }
            let subItemCounter = 1;
            sub.lineItems.forEach((item, itemIdx) => {
              let displayDesc = item.desc;
              const h = item.height || 1;
              const w = item.width || 1;
              const distance = item.distance || 1;
              const days = item.days || 1;
              const qty = item.qty || 1;
              const unitPrice = item.unitPrice || 0;
              const hours = item.hours || 8;
              const cube = item.cube || 0;

              let itemTotal = 0;

              // --- 1. ගණනය කිරීම් සහ Descriptions සකස් කිරීම ---
              if (cat.key === "stageAndTruss") {
                const subTitle = (sub.subTitle || "").toLowerCase();
                if (subTitle.includes("marquee")) {
                  itemTotal = qty * unitPrice;
                } else if (
                  subTitle.includes("goalpost") ||
                  subTitle.includes("main stage") ||
                  subTitle.includes("platform")
                ) {
                  itemTotal = h * w * qty * unitPrice;
                  displayDesc = `${item.desc} (${w}' x ${h}')`;
                } else if (subTitle.includes("normal")) {
                  itemTotal = w * qty * unitPrice;
                  displayDesc = `${item.desc} (${w}' Width)`;
                } else {
                  itemTotal = qty * unitPrice;
                }
              } else if (cat.key === "powerSystems") {
                itemTotal = (unitPrice / 8) * hours * qty * days;
                displayDesc = `${item.desc} (${hours} hours) , ${qty} Qty , ${days} Days`;
              } else if (cat.key === "ledSystems") {
                const qty = Number(item.qty) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const sqPrice = Number(item.sqPrice) || 0;
                const w = Number(item.width) || 0;
                const h = Number(item.height) || 0;
                const cube = Number(item.cube) || 0;

                // Description එක සැකසීම (P4 HD Quality LED Screen...)
                const ledMatch = item.desc.match(/^(P\d+(\.\d+)?)/i);
                if (ledMatch) {
                  const ledType = ledMatch[0].toUpperCase();
                  displayDesc = `${ledType} HD Quality LED Screen`;
                  if (w > 0 && h > 0) {
                    displayDesc += ` (${w}' x ${h}') , ${qty}Qty`;
                  }
                }

                // --- ගණනය කිරීමේ logic එක ---
                // Schema එකේ තියෙන්නේ 'cube' නිසා item.cube පාවිච්චි කරන්න

                if (sub.calculationMethod === "square") {
                  // ක්‍රමය Square Feet නම්: Width * Height * Qty * SqPrice
                  itemTotal = w * h * qty * sqPrice;
                } else {
                  // ක්‍රමය Unit නම්: Cube * Qty * UnitPrice
                  // Cube අගයක් ඇතුළත් කර නැත්නම් (0 නම්) එය 1 ලෙස සලකා ගුණ කරයි
                  const multiplier = cube > 0 ? cube : 1;
                  itemTotal = multiplier * qty * unitPrice;
                }
              } else if (cat.key === "technicianSystems") {
                if (item.desc.includes("Labor")) {
                  displayDesc = `${item.desc} - ${days} Days - ${qty} LaboreQty`;
                } else if (item.desc.includes("Transport")) {
                  displayDesc = `${item.desc} - ${days} Days - ${qty} Lorries - ${distance} km`;
                }
                itemTotal = unitPrice * qty * days * distance;
              } else {
                itemTotal = qty * unitPrice;
              }

              let finalUnitPrice = "";
              if (cat.key === "videoSystems") {
                // 🟢 Video Systems සඳහා පමණක් "Rs." පෙන්වයි
                finalUnitPrice = "Rs.";
              } else {
                // අනෙක් අංශ සඳහා සාමාන්‍ය මිල පෙන්වයි
                finalUnitPrice = unitPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              }

              categoryTotal += itemTotal;
              // Reference Number සෑදීම
              let refNumber = showHeaderFor.includes(cat.key)
                ? `${activeCategoryCounter}.${subIdx + 1}.${itemIdx + 1}`
                : `${activeCategoryCounter}.${itemGlobalCounter}`;

              // --- 2. Table එකට දත්ත ඇතුළත් කිරීම (Row Construction) ---

              // LED Breakdown එකක් තිබේ නම් (All video items)
              if (cat.key === "ledSystems") {
                const qty = Number(item.qty) || 0;
                const w = Number(item.width) || 0;
                const h = Number(item.height) || 0;
                const cube = Number(item.cube) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const sqPrice = Number(item.sqPrice) || 0;

                // --- 1. Quantity එක ක්‍රමය අනුව ගණනය කිරීම (හැම Item එකකටම පොදුවේ) ---
                let totalCalculatedQty = 0;
                let priceToDisplay = 0;

                if (sub.calculationMethod === "square") {
                  totalCalculatedQty = w * h * qty; // Width * Height * Qty
                  priceToDisplay = sqPrice;
                  itemTotal = w * h * qty * sqPrice;
                  displayDesc = `${item.desc} (${w}' x ${h}') , ${qty}Qty`;
                } else {
                  const multiplier = cube > 0 ? cube : 1;
                  totalCalculatedQty = multiplier * qty; // Cube * Qty
                  priceToDisplay = unitPrice;
                  itemTotal = multiplier * qty * unitPrice;
                  displayDesc = `${item.desc} (${w}' x ${h}') , ${qty}Qty`;
                }

                // --- 2. Table එකට Rows ඇතුළත් කිරීම ---

                // All video breakdown එකක් තිබේ නම්
                if (item.desc.includes("All video")) {
                  const breakdown = [
                    "Video Mapping System With Apple I Mac",
                    "Operating System for Processors",
                    "Seamless Video Switcher",
                    "Processing Units",
                    "Video Wall Processors",
                    "Installation, Cabling & Wiring",
                    "Processing Units",
                  ];

                  breakdown.forEach((bText, bIdx) => {
                    tableRows.push([
                      `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`, // subItemCounter භාවිතා කරන්න
                      bText,
                      bIdx === 0 ? totalCalculatedQty.toLocaleString() : "",
                      bIdx === 0
                        ? priceToDisplay.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : "",
                      bIdx === 0
                        ? itemTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : "",
                    ]);
                    subItemCounter++; // breakdown එකේ හැම පේළියකටම පසු අංකය වැඩි කරන්න
                  });
                }
                // සාමාන්‍ය LED Item එකක් නම් (Breakdown නැති ඒවා)
                else {
                  tableRows.push([
                    `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`, // subItemCounter භාවිතා කරන්න
                    displayDesc,
                    totalCalculatedQty.toLocaleString(),
                    priceToDisplay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                    itemTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                  ]);
                  subItemCounter++; // අංකය වැඩි කරන්න
                }
              }
              // සාමාන්‍ය පේළි සඳහා (Technician නම් distance, නැත්නම් qty පෙන්වයි)
              // --- සාමාන්‍ය පේළි සඳහා (Technician, Power සහ අනෙකුත් අංශ) ---
              else {
                let finalCalculatedQty = "";

                if (cat.key === "technicianSystems") {
                  finalCalculatedQty = item.desc.includes("Transport")
                    ? `${(distance * days * qty).toLocaleString()}`
                    : `${(qty * days).toLocaleString()}`;
                }
                // 🟢 Power Systems සඳහා Quantity එක Days * Qty ලෙස පෙන්වීම
                else if (cat.key === "powerSystems") {
                  finalCalculatedQty = `${(days * qty).toLocaleString()}`;
                } else if (cat.key === "stageAndTruss") {
                  finalCalculatedQty = `${(w * h * qty).toLocaleString()}`;
                } else if (cat.key === "videoSystems") {
                  finalCalculatedQty = " ";
                } else {
                  finalCalculatedQty = item.qty || "";
                }

                tableRows.push([
                  refNumber,
                  displayDesc,
                  finalCalculatedQty, // ගණනය කළ Quantity එක මෙතනට වැටේ
                  finalUnitPrice,
                  `${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                  `${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                ]);
              }
              itemGlobalCounter++;
            });
          });

          // Category Total පේළිය (කලින් පරිදිම)
          tableRows.push([
            {
              content: `Total Amount for ${cat.label}`,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: cat.color,
              },
            },
            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: cat.color,
              },
            },
            {
              content: `${categoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: cat.color,
              },
            },
          ]);

          // Page Break Check
          if (finalY > 240) {
            doc.addPage();
            drawPageBorder();
            finalY = 25;
          }

          autoTable(doc, {
            startY: finalY,
            // head: [
            //   [
            //     // මෙන්න මෙතන තමයි ප්‍රධාන Category අංකය dynamic වෙන්නේ
            //     {
            //       content: `${activeCategoryCounter}`,
            //       styles: { halign: "center" },
            //     },
            //     {
            //       content: `${cat.label}`,
            //       colSpan: 4,
            //       styles: { halign: "left" },
            //     },
            //   ],
            // ],
            body: tableRows,
            // ... අනෙක් Styles කලින් පරිදිම ...
            theme: "grid",
            headStyles: {
              fillColor: cat.color,
              textColor: [0, 0, 0],
              fontStyle: "bold",
            },
            styles: {
              fontSize: 7,
              lineColor: [0, 0, 0],
              lineWidth: 0.1,
              valign: "middle",
            },
            columnStyles: {
              0: { cellWidth: 20, halign: "center", fontStyle: "bold" },
              1: { cellWidth: 90 },
              2: { cellWidth: 20, halign: "center" },
              3: { cellWidth: 30, halign: "right" },
              4: { cellWidth: 35, halign: "right" },
            },
            margin: { left: 10, right: 5 },
          });

          finalY = doc.lastAutoTable.finalY + 8;

          // මේ Category එක සාර්ථකව ඇන්ද නිසා ඊළඟ එකට අංකය 1කින් වැඩි කරනවා
          activeCategoryCounter++;
        }
      }
    });


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
             /* මුළු Group එකටම අදාළ පර්සන්ටේජ් එක */
             value={
               invoice.discountTotalLEDLightingSoundStageTrussPercent || ""
             }
             onChange={(e) => {
               const percent = parseFloat(e.target.value) || 0;

               // Total එක ගණනය කරමු (Discount එකට පෙර)
               let totalBeforeDiscount = 0;
               if (isRehearsal === "Yes") {
                 totalBeforeDiscount += parseFloat(
                   summaryDayValues[`${table.id}_rehearsal_amount`] || 0,
                 );
               }
               for (let i = 0; i < (Number(specialNote) || 0); i++) {
                 totalBeforeDiscount += parseFloat(
                   summaryDayValues[`${table.id}_${i}_amount`] || 0,
                 );
               }

               // පර්සන්ටේජ් එක අනුව රුපියල් අගය ගණනය කිරීම
               const rsValue = (totalBeforeDiscount * percent) / 100;

               // State දෙකම එකවර update කිරීම
               setInvoice((prev) => ({
                 ...prev,
                 discountTotalLEDLightingSoundStageTrussPercent: percent,
                 discountTotalLEDLightingSoundStageTruss: rsValue,
               }));
             }}
             style={{ flex: 1, padding: "4px" }}
             placeholder="%"
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
             value={invoice.discountTotalLEDLightingSoundStageTruss || ""}
             onChange={(e) => {
               const rsVal = parseFloat(e.target.value) || 0;

               let totalBeforeDiscount = 0;
               if (isRehearsal === "Yes") {
                 totalBeforeDiscount += parseFloat(
                   summaryDayValues[`${table.id}_rehearsal_amount`] || 0,
                 );
               }
               for (let i = 0; i < (Number(specialNote) || 0); i++) {
                 totalBeforeDiscount += parseFloat(
                   summaryDayValues[`${table.id}_${i}_amount`] || 0,
                 );
               }

               // රුපියල් අගය අනුව පර්සන්ටේජ් එක සෙවීම
               const percentVal =
                 totalBeforeDiscount > 0
                   ? (rsVal / totalBeforeDiscount) * 100
                   : 0;

               setInvoice((prev) => ({
                 ...prev,
                 discountTotalLEDLightingSoundStageTruss: rsVal,
                 discountTotalLEDLightingSoundStageTrussPercent:
                   percentVal.toFixed(2), // දශම 2 කට
               }));
             }}
             style={{ flex: 1, padding: "4px", border: "1px solid #ccc" }}
             placeholder="Rs."
           />
         </div>
       </div>
     </td>;





<td
  style={{
    border: "1px solid #ddd",
    padding: "8px",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "5px",
    }}
  >
    <span style={{ fontSize: "11px", color: "#666" }}>Rs.</span>
    <input
      type="number"
      /* මෙහි invoice.discountTotal... වෙනුවට කෙලින්ම අගය පෙන්වන්න */
      value={invoice.discountTotalLEDLightingSoundStageTruss || ""}
      onChange={(e) => {
        const val = parseFloat(e.target.value) || 0;
        /* වැදගත්: මෙහිදී ඔබේ state update කරන function එක නිවැරදිව call කරන්න */
        setInvoice((prev) => ({
          ...prev,
          discountTotalLEDLightingSoundStageTruss: val,
        }));
      }}
      style={{
        flex: 1,
        padding: "4px",
        border: "1px solid #ccc",
      }}
    />
  </div>
</td>;








 const saveToDatabase = async (noteValue = "") => {
    let finalSubTotal = 0;
    let finalDiscount = 0; // Overall Discount (Main)
    let finalDiscountPercent = 0;
    let finalVat = 0;
    let finalGrandTotal = 0;
    let summaryDetails = [];

    // --- 1. පද්ධති වල මුලික එකතුවන් (Base Totals) ගණනය කිරීම ---
    const ledT = calculateCategoryTotal(invoice.ledSystems);
    const lightT = calculateCategoryTotal(invoice.lightSystems);
    const soundT = calculateCategoryTotal(invoice.soundSystems);
    const stageT = calculateCategoryTotal(invoice.stageAndTruss);

    // LED කාණ්ඩයේ පද්ධති 4 හි මුළු එකතුව (Discount කිරීමට පෙර)
    const totalLEDGroupBeforeDiscount = ledT + lightT + soundT + stageT;

    // LED කාණ්ඩයට ලබා දී ඇති Special Discount අගයන් State එකෙන් ලබා ගැනීම
    const ledGroupDiscountAmount =
      Number(invoice.discountTotalLEDLightingSoundStageTruss) || 0;
    const ledGroupDiscountPercent =
      Number(invoice.discountTotalLEDLightingSoundStageTrussPercent) || 0;

    // LED කාණ්ඩයේ ශුද්ධ එකතුව (Net Amount for LED Group)
    const netLEDGroup = totalLEDGroupBeforeDiscount - ledGroupDiscountAmount;

    // අනෙකුත් පද්ධති වල එකතුව
    const powerT = calculateCategoryTotal(invoice.powerSystems);
    const videoT = calculateCategoryTotal(invoice.videoSystems);
    const techT = calculateCategoryTotal(invoice.technicianSystems);
    const otherT = calculateCategoryTotal(invoice.otherSystems);

    // --- 2. "More than days" (Summary Table) Logic ---
    if (showSummary) {
      let summarySubTotal = 0;
      const categories = [
        {
          id: "led",
          title: "LED, Lighting, Sound, Stage & Truss Systems",
          // මෙහි base අගය ලෙස Discount කළ පසු අගය (netLEDGroup) භාවිතා කරයි
          base: netLEDGroup,
        },
        { id: "power", title: "Power Generator System", base: powerT },
        { id: "video", title: "Video Animation Services", base: videoT },
        { id: "tech", title: "Technician & Transport Charges", base: techT },
        { id: "other", title: "Other Services", base: otherT },
      ];

      summaryDetails = categories.map((cat) => {
        let row = [];
        let categoryFinalTotal = 0;

        // Rehearsal සඳහා ගණනය කිරීම
        if (isRehearsal === "Yes") {
          const amt =
            parseFloat(summaryDayValues[`${cat.id}_rehearsal_amount`]) || 0;
          row.push({
            rowType: "Rehearsal",
            discountRs:
              parseFloat(summaryDayValues[`${cat.id}_rehearsal_discount_rs`]) ||
              0,
            discountPercent:
              parseFloat(
                summaryDayValues[`${cat.id}_rehearsal_discount_percent`],
              ) || 0,
            amount: amt,
          });
          categoryFinalTotal += amt;
        }

        // එක් එක් දවස් සඳහා ගණනය කිරීම
        for (let i = 0; i < (Number(specialNote) || 0); i++) {
          const amt =
            parseFloat(summaryDayValues[`${cat.id}_${i}_amount`]) || 0;
          row.push({
            rowType: `Day ${i + 1}`,
            discountRs:
              parseFloat(summaryDayValues[`${cat.id}_${i}_discount_rs`]) || 0,
            discountPercent:
              parseFloat(summaryDayValues[`${cat.id}_${i}_discount_percent`]) ||
              0,
            amount: amt,
          });
          categoryFinalTotal += amt;
        }

        summarySubTotal += categoryFinalTotal;
        return {
          categoryId: cat.id,
          categoryTitle: cat.title,
          baseTotal: cat.base,
          row: row,
          categoryFinalTotal: categoryFinalTotal,
        };
      });

      finalSubTotal = summarySubTotal;
      finalDiscountPercent = Number(invoice.discountPercent) || 0;
      // Overall Discount එක ප්‍රතිශතයක් ලෙස ඇත්නම් එය ගණනය කිරීම
      finalDiscount = (finalSubTotal * finalDiscountPercent) / 100;
    }

    // --- 3. "Normal Quotation" Logic ---
    else {
      // LED Group එකේ Discount අඩු කළ අගය + අනෙක් ඒවයේ එකතුව
      finalSubTotal = netLEDGroup + powerT + videoT + techT + otherT;
      finalDiscountPercent = Number(invoice.discountPercent) || 0;
      finalDiscount = Number(invoice.discount) || 0;
    }

    // --- 4. අවසාන ගණනය කිරීම් (Tax & Grand Total) ---
    const totalValueOfSupply = finalSubTotal - finalDiscount;
    finalvat = totalValueOfSupply * 0.18;
    finalGrandTotal = totalValueOfSupply + finalVat;

    // --- 5. Database එකට යවන දත්ත සැකසීම ---
    const finalData = {
      ...invoice,
      summaryDetails,

      // පද්ධති වල මුළු අගයන් (Totals for Database)
      totalLEDLightingSoundStageTruss: totalLEDGroupBeforeDiscount, // Original Total
      discountTotalLEDLightingSoundStageTruss: ledGroupDiscountAmount, // Discount Rs.
      discountTotalLEDLightingSoundStageTrussPercent: ledGroupDiscountPercent, // Discount %

      totalPowerGenerator: powerT,
      totalVideoAnimation: videoT,
      totalTechnicianTransport: techT,
      totalOtherServices: otherT,

      // ප්‍රධාන එකතුවන්
      subTotal: Number(finalSubTotal.toFixed(2)),
      discount: Number(finalDiscount.toFixed(2)),
      discountPercent: Number(finalDiscountPercent),
      totalValueOfSupply: Number(totalValueOfSupply.toFixed(2)),
      vat: Number(finalVat.toFixed(2)),
      grandTotal: Number(finalGrandTotal.toFixed(2)),

      specialNote: noteValue,
      nomal: showSummary ? 0 : 1,
      eventDays: showSummary
        ? Number(specialNote) || 0
        : invoice.eventDate.length,
      rehearsalDay: isRehearsal === "Yes" ? 1 : 0,
    };

    // --- 6. Axios හරහා API එකට යැවීම ---
    try {
      const response = await axios.post(
        "http://localhost:5000/api/quotations",
        finalData,
      );
      if (response.status === 201) {
        alert("✅ Quotation එක සාර්ථකව Save කළා!");
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Save Error:", err);
      alert("❌ Save කිරීමේදී ගැටලුවක් මතු විය. කරුණාකර නැවත උත්සාහ කරන්න.");
    }
  };

      <div style={{ marginTop: "20px" }}>
        <button className="btn-edit" onClick={() => navigate(-1)}>
          Back
        </button>
        <button
          className="btn-download"
          style={{ marginLeft: "10px", backgroundColor: "#e53e3e" }}
          onClick={() => {
            if (
              window.confirm("Are you sure you want to clear all invoices?")
            ) {
              localStorage.removeItem("invoices");
              setAllInvoices([]);
            }
          }}
        >
          Clear All Invoices
        </button>
      </div>;






 <div
          className="total-line"
          style={{ color: "#d32f2f", fontWeight: "bold" }}
        >
         if {dynamicSystemsName} have Discount / Sponsorship for :
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* LED Group % Input */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="number"
                placeholder="%"
                value={
                  invoice.discountTotalLEDLightingSoundStageTrussPercent || ""
                }
                // පේළි අංක 987 අසල ඇති % Input එක සඳහා:
                onChange={(e) => {
                  const pct = Number(e.target.value);
                  const amt = (subTotalLEDGroup * pct) / 100;

                  const newNetLED = subTotalLEDGroup - amt;
                  const newSubTotal = newNetLED + otherCategoriesTotal;

                  setInvoice({
                    ...invoice,
                    discountTotalLEDLightingSoundStageTrussPercent: pct,
                    discountTotalLEDLightingSoundStageTruss: amt,
                    discount:
                      (newSubTotal * (invoice.discountPercent || 0)) / 100, // මෙය එකතු කරන්න
                  });
                }}
                style={{
                  width: "60px",
                  textAlign: "right",
                  padding: "2px 5px",
                }}
              />
              <span style={{ marginLeft: "5px" }}>%</span>
            </div>

            <span>Rs.</span>

            {/* LED Group Rs. Input */}
            <input
              type="number"
              className="discount-input"
              value={invoice.discountTotalLEDLightingSoundStageTruss || ""}
              onChange={(e) => {
                const amt = Number(e.target.value);
                const pct =
                  subTotalLEDGroup > 0 ? (amt / subTotalLEDGroup) * 100 : 0;

                // අලුත් Sub Total එක ගණනය කිරීම (LED Net + Others)
                const newNetLEDGroup = subTotalLEDGroup - amt;
                const newSubTotal = newNetLEDGroup + otherCategoriesTotal;

                setInvoice({
                  ...invoice,
                  discountTotalLEDLightingSoundStageTruss: amt,
                  discountTotalLEDLightingSoundStageTrussPercent: parseFloat(
                    pct.toFixed(2),
                  ),
                  // Overall discount එක අලුත් SubTotal එකට අනුව නැවත සකසන්න
                  discount:
                    (newSubTotal * (invoice.discountPercent || 0)) / 100,
                });
              }}
              style={{ width: "120px", textAlign: "right", padding: "2px 5px" }}
            />
          </div>





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
                        <option value="Normal">Normal Quotation</option>
                        <option value="Non-Tax with Discount">
                          Non-Tax with Discount
                        </option>
                        <option value="Non-Tax without Discount">
                          Non-Tax without Discount
                        </option>
                        <option value="edit">Edit Quotation</option>
                      </select>
                    </div>

                    <div className="popup-actions">
                      <button
                        className="btn-confirm-save"
                        style={{ backgroundColor: "#2e7d32", color: "white" }}
                        onClick={() => {
                          if (quotationType === "edit") {
                            // පළමු row එකට පවතින subTotal එක ලබා දීම
                            setEditExtraRows([
                              { label: "Total Amount", value: subTotal },
                            ]);
                            setShowEditConfirmation(true);
                          } else {
                            saveToDatabase("Normal");
                          }
                        }}
                      >
                        Confirm & Save
                      </button>
                      <button
                        className="btn-close"
                        onClick={() => setShowTypeSelection(false)}
                      >
                        Back
                      </button>
                    </div>
                  </>







                  {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-content custom-popup">
            {/* 1. මුලින්ම පෙන්වන කොටස (Normal or More than days) */}
            {!isMoreThanDays && !showSummary && (
              <div>
                {/* මුල් පියවර: Normal / More than days */}
                {!showTypeSelection && !showEditConfirmation ? (
                  <>
                    <h3 style={{ color: "#1a237e" }}>Save Quotation</h3>
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
                    </div>
                  </>
                ) : showEditConfirmation ? (
                  /* 2. "edit" තෝරා Confirm කළ පසු පෙන්වන Edit Notice Popup එක */
                  <>
                    <h3 style={{ color: "#d32f2f", marginBottom: "15px" }}>
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
                    </div>
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
                        <option value="Normal">Normal Quotation</option>
                        <option value="Non-Tax with Discount">
                          Non-Tax with Discount
                        </option>
                        <option value="Non-Tax without Discount">
                          Non-Tax without Discount
                        </option>
                        <option value="edit">Edit Quotation</option>
                      </select>
                    </div>

                    <div className="popup-actions">
                      <button
                        className="btn-confirm-save"
                        style={{ backgroundColor: "#2e7d32", color: "white" }}
                        onClick={() => {
                          if (quotationType === "edit") {
                            // පළමු row එකට පවතින subTotal එක ලබා දීම
                            setEditExtraRows([
                              { label: "Total Amount", value: subTotal },
                            ]);
                            setShowEditConfirmation(true);
                          } else {
                            saveToDatabase("Normal");
                          }
                        }}
                      >
                        Confirm & Save
                      </button>
                      <button
                        className="btn-close"
                        onClick={() => setShowTypeSelection(false)}
                      >
                        Back
                      </button>
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
                <div className="NumberDaysFull">
                  <label>How many days do event?</label>
                  <input
                    type="number"
                    className="NumberDays"
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)} // දවස් ගණන පමණක් මෙතනින් වෙනස් වේ
                  />
                </div>

                {/* Rehearsal එක (Yes/No) - මෙතනට පාවිච්චි කරන්නේ අලුත් isRehearsal state එක */}
                <div className="NumberDaysFull">
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
                </div>
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




      <button
                        className="btn-confirm-save"
                        style={{ backgroundColor: "#2e7d32", color: "white" }}
                        onClick={() => {
                          if (quotationType === "edit") {
                            // පළමු row එකට පවතින subTotal එක ලබා දීම
                            setEditExtraRows([
                              { label: "Total Amount", value: subTotal },
                            ]);
                            setShowEditConfirmation(true);
                          } else {
                            saveToDatabase("Normal Quotation");
                          }
                        }}
                      >
                        Confirm & Save
                      </button>






                      {finalView:finalViewYes ? (
          <div
            className="final-confirmation-display"
            style={{
              padding: "20px",
              backgroundColor: "#f0f7f0",
              borderRadius: "8px",
              border: "1px solid #2e7d32",
              maxWidth: "100%", // අවශ්‍ය නම් පළල පාලනය කරන්න
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

            {/* පොදුවේ හැම පේළියකටම Style එකක් මෙලෙස යෙදිය හැකියි */}
            <style>{`
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          border-bottom: 1px dashed #c8e6c9; /* පේළි වෙන් කර හඳුනාගන්න ලස්සන ඉරක් */
          padding-bottom: 4px;
        }
        .info-value {
          font-weight: 500;
          text-align: right;
        }
      `}</style>

            {finalView === "Normal Quotation" && (
              <>
                <div className="info-row">
                  <strong>Grand Total Amount :</strong>
                  <span className="info-value">
                    Rs. {subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Wording :</strong>
                  <span className="info-value">
                    {numberToWords(Math.round(subTotal))}
                  </span>
                </div>
                <div
                  className="info-row"
                  style={{ borderBottom: "none", marginTop: "10px" }}
                >
                  <strong>Mode of Payment :</strong>
                  <span className="info-value">Cash</span>
                </div>
              </>
            )}

            {finalView === "Normal Quotation with Discount" && (
              <>
                <div className="info-row">
                  <strong>Sub Total Amount :</strong>
                  <span className="info-value">
                    Rs. {subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Discount ({invoice.discountPercent}%) :</strong>
                  <span className="info-value">
                    Rs. {invoice.discount.toLocaleString()}
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
                <div
                  className="info-row"
                  style={{ borderBottom: "none", marginTop: "10px" }}
                >
                  <strong>Mode of Payment :</strong>
                  <span className="info-value">Cash</span>
                </div>
              </>
            )}

            {finalView === "Vat Quotation" && (
              <>
                <div className="info-row">
                  <strong>Total Value of Supply :</strong>
                  <span className="info-value">
                    Rs. {subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>VAT Amount (18%) :</strong>
                  <span className="info-value">Rs. {vat.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <strong>Total Amount Including VAT :</strong>
                  <span className="info-value">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Wording :</strong>
                  <span className="info-value">
                    {numberToWords(Math.round(grandTotal))}
                  </span>
                </div>
                <div
                  className="info-row"
                  style={{ borderBottom: "none", marginTop: "10px" }}
                >
                  <strong>Mode of Payment :</strong>
                  <span className="info-value">
                    cheque in favour of "Imagine Entertainment (Pvt) Ltd
                  </span>
                </div>
              </>
            )}

            {finalView === "Vat Quotation with Discount" && (
              <>
                <div className="info-row">
                  <strong>Sub Total Amount :</strong>
                  <span className="info-value">
                    Rs. {subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Discount :</strong>
                  <span className="info-value">
                    Rs. {invoice.discount.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Total Value of Supply :</strong>
                  <span className="info-value">
                    Rs. {totalValueOfSupply.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>VAT Amount (18%) :</strong>
                  <span className="info-value">Rs. {vat.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <strong>Grand Total (Inc. VAT) :</strong>
                  <span className="info-value">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Wording :</strong>
                  <span className="info-value">
                    {numberToWords(Math.round(grandTotal))}
                  </span>
                </div>
                <div
                  className="info-row"
                  style={{ borderBottom: "none", marginTop: "10px" }}
                >
                  <strong>Mode of Payment :</strong>
                  <span className="info-value">
                    cheque in favour of "Imagine Entertainment (Pvt) Ltd
                  </span>
                </div>
              </>
            )}:
            <div
            className="final-confirmation-display"
            style={{
              padding: "20px",
              backgroundColor: "#f0f7f0",
              borderRadius: "8px",
              border: "1px solid #2e7d32",
              maxWidth: "100%", // අවශ්‍ය නම් පළල පාලනය කරන්න
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
              Confirmed: {finalViewYes}
            </h3>

            {/* පොදුවේ හැම පේළියකටම Style එකක් මෙලෙස යෙදිය හැකියි */}
            <style>{`
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          border-bottom: 1px dashed #c8e6c9; /* පේළි වෙන් කර හඳුනාගන්න ලස්සන ඉරක් */
          padding-bottom: 4px;
        }
        .info-value {
          font-weight: 500;
          text-align: right;
        }
      `}</style>

            {finalViewYes === "Normal Quotation" && (
              <>
                <div className="info-row">
                  <strong>Grand Total Amount :</strong>
                  <span className="info-value">
                    Rs. {subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Wording :</strong>
                  <span className="info-value">
                    {numberToWords(Math.round(subTotal))}
                  </span>
                </div>
                <div
                  className="info-row"
                  style={{ borderBottom: "none", marginTop: "10px" }}
                >
                  <strong>Mode of Payment :</strong>
                  <span className="info-value">Cash</span>
                </div>
              </>
            )}

            {finalViewYes === "Normal Quotation with Discount" && (
              <>
                <div className="info-row">
                  <strong>Sub Total Amount :</strong>
                  <span className="info-value">
                    Rs. {subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Discount ({invoice.discountPercent}%) :</strong>
                  <span className="info-value">
                    Rs. {invoice.discount.toLocaleString()}
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
                <div
                  className="info-row"
                  style={{ borderBottom: "none", marginTop: "10px" }}
                >
                  <strong>Mode of Payment :</strong>
                  <span className="info-value">Cash</span>
                </div>
              </>
            )}

            {finalViewYes === "Vat Quotation" && (
              <>
                <div className="info-row">
                  <strong>Total Value of Supply :</strong>
                  <span className="info-value">
                    Rs. {subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>VAT Amount (18%) :</strong>
                  <span className="info-value">Rs. {vat.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <strong>Total Amount Including VAT :</strong>
                  <span className="info-value">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Wording :</strong>
                  <span className="info-value">
                    {numberToWords(Math.round(grandTotal))}
                  </span>
                </div>
                <div
                  className="info-row"
                  style={{ borderBottom: "none", marginTop: "10px" }}
                >
                  <strong>Mode of Payment :</strong>
                  <span className="info-value">
                    cheque in favour of "Imagine Entertainment (Pvt) Ltd
                  </span>
                </div>
              </>
            )}

            {finalViewYes === "Vat Quotation with Discount" && (
              <>
                <div className="info-row">
                  <strong>Sub Total Amount :</strong>
                  <span className="info-value">
                    Rs. {subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Discount :</strong>
                  <span className="info-value">
                    Rs. {invoice.discount.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Total Value of Supply :</strong>
                  <span className="info-value">
                    Rs. {totalValueOfSupply.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>VAT Amount (18%) :</strong>
                  <span className="info-value">Rs. {vat.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <strong>Grand Total (Inc. VAT) :</strong>
                  <span className="info-value">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Wording :</strong>
                  <span className="info-value">
                    {numberToWords(Math.round(grandTotal))}
                  </span>
                </div>
                <div
                  className="info-row"
                  style={{ borderBottom: "none", marginTop: "10px" }}
                >
                  <strong>Mode of Payment :</strong>
                  <span className="info-value">
                    cheque in favour of "Imagine Entertainment (Pvt) Ltd
                  </span>
                </div>
              </>

          </div>
        ) : (
          <h1 style={{ color: "#ccc" }}>No Quotation Saved Yet</h1>
        )}
