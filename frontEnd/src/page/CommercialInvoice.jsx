import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../css/viewInvoice.css";

export default function CommercialInvoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const [allInvoices, setAllInvoices] = useState([]);

  useEffect(() => {
    const savedInvoices = JSON.parse(localStorage.getItem("invoices")) || [];
    const newInvoice = location.state?.newInvoice;

    if (newInvoice) {
      const exists = savedInvoices.find((inv) => inv._id === newInvoice._id);
      if (!exists) {
        // අලුතින් එන විට Default "Tax Invoice" ලෙස සකසයි
        const invoiceWithStatus = {
          ...newInvoice,
          invoiceType: newInvoice.quotationCategory || "Tax Invoice",
          invoiceFooterType: newInvoice.invoiceFooterType || "Proforma Invoice",
        };
        const updatedList = [invoiceWithStatus, ...savedInvoices];
        setAllInvoices(updatedList);
        localStorage.setItem("invoices", JSON.stringify(updatedList));
      } else {
        setAllInvoices(savedInvoices);
      }
    } else {
      setAllInvoices(savedInvoices);
    }
  }, [location.state]);

  // Dropdown එක වෙනස් කර Database එක Update කරන Function එක
  // Function එක මේ ආකාරයට වෙනස් කරන්න

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
  const generatePDF = (q, actionType = "download") => {
    // 0 හෝ "0" දෙකම පරීක්ෂා කිරීම ආරක්ෂිතයි
    if (
      (q.discountButtonYes === 0 || q.discountButtonYes === "0") &&
      (q.multiDays === 0 || q.multiDays === "0")
    ) {
      console.log("Switching to Normal PDF...");
      generateNormalPDF(q, actionType);
    } else if (
      (q.discountButtonYes === 1 || q.discountButtonYes === "1") &&
      (q.multiDays === 0 || q.multiDays === "0")
    ) {
      console.log("Switching to Summary PDF...");
      generateSummaryPDF(q, actionType);
    } else {
      console.log("Switching to Summary PDF...");
      generateMultiDaysPDF(q, actionType);
    }
  };

  const generateNormalPDF = (q, actionType) => {
    const doc = new jsPDF();

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

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.rect(65, 10, 80, 6);
        doc.text((q.invoiceType || "QUOTATION").toUpperCase(), 105, 14.5, {
          align: "center",
        });
        // doc.setFontSize(8);
        // doc.text("DUPLICATE", 195, 45, { align: "right" });
      }
    };

    drawPageBorder();
    drawHeader(true);

    let startY = 22.5;
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
      ? new Date(q.date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";
    doc.text(`Date of Quotation:    ${formattedDate1}`, 11, startY + 3.5);

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
          .map((d) =>
            new Date(d).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            }),
          )
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
      11,
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
                } else {
                  let finalDescription = displayDesc;

                  // 1. "P" අකුරෙන් පටන් ගන්නේදැයි පරීක්ෂා කිරීම
                  if (item.desc.trim().startsWith("P")) {
                    const words = item.desc.split(" "); // වචන වලට වෙන් කිරීම

                    // 2. මුල් වචන දෙක පමණක් ගැනීම (උදා: "P3.91 Outdoor")
                    const firstTwoWords = words.slice(0, 2).join(" ");

                    // 3. අලුත් Format එක සැකසීම
                    finalDescription = `${firstTwoWords} HD Quality LED Screen (${w}' x ${h}') , ${qty}Qty`;
                  }

                  tableRows.push([
                    `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`,
                    finalDescription, // මෙතනට අලුතින් සැකසූ description එක ලබා දෙනවා
                    totalCalculatedQty.toLocaleString(),
                    priceToDisplay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                    itemTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                  ]);
                  subItemCounter++;
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

    // දත්ත පරීක්ෂාව (Condition)
    if (q.totalLEDLightingSoundStageTruss > 0) {
      const totalLEDGroup = q.totalLEDLightingSoundStageTruss; // 42500
      // const ledDiscount = q.discountTotalLEDLightingSoundStageTruss; // 21250
      // const afterDiscount = totalLEDGroup - ledDiscount; // 21250

      autoTable(doc, {
        startY: finalY,
        body: [
          // 1. Header Row
          [
            {
              content: `SUMMARY FOR LED, LIGHTING, SOUND, STAGE & TRUSS`,
              colSpan: 5,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],

          // 2. Total Amount Row
          [
            {
              content: `Total Amount for LED, Light, Sound, Stage & Truss`,
              colSpan: 3,
              styles: { fontStyle: "bold" },
            },
            { content: `Rs.`, styles: { halign: "right", fontStyle: "bold" } },
            {
              content: totalLEDGroup.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { halign: "right", fontStyle: "bold" },
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

    categoriesOther.forEach((cat) => {
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
                  displayDesc = `${item.desc} - ${days} Days - ${qty} Qty`;
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
    if (
      q.invoiceType === "Commercial Invoice" ||
      q.invoiceType === "Normal Invoice" ||
      q.invoiceType === "Tax Invoice" ||
      (q.invoiceType === "Proforma Invoice" &&
        q.proformaCategory === "Quotation Type")
    ) {
      if (q.quotationCategory === "Normal Quotation") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        const totalInWords = numberToWords(Math.floor(q.subTotal));
        doc.text(`${totalInWords}`, 55, finalY);
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash", 45, finalY);
      } else if (q.quotationCategory === "Normal Quotation with Discount") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Sub Total Amount ",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Less: Special Discount ",
              "Rs.",
              `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Grand Total Amount ",
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

        finalY = doc.lastAutoTable.finalY + 5;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Total Amount in Words:", 13, finalY);
        doc.setFont("helvetica", "normal");
        const totalInWords = numberToWords(
          Math.floor(q.subTotal - (q.discount || 0)),
        );
        doc.text(`${totalInWords}`, 55, finalY);

        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash", 45, finalY);
      } else if (q.quotationCategory === "Vat Quotation") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Total Value of Supply",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              `${(q.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Amount Including VAT ",
              "Rs.",
              `${(q.subTotal + (q.vat || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        const totalInWords = numberToWords(
          Math.floor(q.subTotal + (q.vat || 0)),
        );
        doc.text(`${totalInWords}`, 55, finalY);

        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cheque in favour of", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 71, finalY);
      } else if (q.quotationCategory === "Vat Quotation with Discount") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Sub Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],

            [
              "Less: Special Discount",
              "Rs.",
              `${q.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Value of Supply",
              "Rs.",
              `${q.totalValueOfSupply.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              `${(q.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Amount Including VAT ",
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
        doc.text("Cheque in favour of ", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 72, finalY);
      } else if (q.quotationCategory === "Normal Quotation More Days") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        doc.text("Cash ", 45, finalY);
      }
    } else if (
      q.invoiceType === "Proforma Invoice" &&
      q.proformaCategory === "Requesting Advance"
    ) {
      if (q.quotationCategory === "Normal Quotation") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        const totalInWords = numberToWords(Math.floor(q.subTotal));
        doc.text(`${totalInWords}`, 55, finalY);
        finalY += 12;
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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

        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash", 45, finalY);
      } else if (q.quotationCategory === "Normal Quotation with Discount") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Sub Total Amount ",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Less: Special Discount ",
              "Rs.",
              `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Grand Total Amount ",
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

        finalY = doc.lastAutoTable.finalY + 5;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Total Amount in Words:", 13, finalY);
        doc.setFont("helvetica", "normal");
        const totalInWords = numberToWords(
          Math.floor(q.subTotal - (q.discount || 0)),
        );
        doc.text(`${totalInWords}`, 55, finalY);
        finalY += 12;
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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

        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash", 45, finalY);
      } else if (q.quotationCategory === "Vat Quotation") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Total Value of Supply",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              `${(q.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Amount Including VAT ",
              "Rs.",
              `${(q.subTotal + (q.vat || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        const totalInWords = numberToWords(
          Math.floor(q.subTotal + (q.vat || 0)),
        );
        doc.text(`${totalInWords}`, 55, finalY);

        finalY += 12;
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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

        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cheque in favour of", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 71, finalY);
      } else if (q.quotationCategory === "Vat Quotation with Discount") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Sub Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],

            [
              "Less: Special Discount",
              "Rs.",
              `${q.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Value of Supply",
              "Rs.",
              `${q.totalValueOfSupply.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              `${(q.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Amount Including VAT ",
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
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cheque in favour of ", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 72, finalY);
      } else if (q.quotationCategory === "Normal Quotation More Days") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        doc.text("Cash ", 45, finalY);
      }
    }

    // else if (q.quotationCategory === "edit") {
    //   // 1. Database එකේ ඇති editExtraRows Array එක table එකට ගැලපෙන ලෙස සකස් කිරීම
    //   const editRowsBody = (q.editExtraRows || []).map((row) => [
    //     row.label, // "Total Amount", "vat valu", "include vat" වැනි labels
    //     "Rs.",
    //     Number(row.value).toLocaleString(undefined, {
    //       minimumFractionDigits: 2,
    //     }), // අගය formatting කිරීම
    //   ]);

    //   // 2. Dynamic Table එක නිර්මාණය කිරීම
    //   autoTable(doc, {
    //     startY: finalY,
    //     body: editRowsBody, // මෙතනට සකස් කරගත් Rows ලබා දෙනවා
    //     theme: "grid",
    //     styles: {
    //       fontSize: 8,
    //       fontStyle: "bold",
    //       lineColor: [0, 0, 0],
    //       lineWidth: 0.2,
    //     },
    //     columnStyles: footerColStyles,
    //     margin: { left: 10 },
    //   });

    //   // 3. "Total Amount in Words" කොටස සඳහා අවසාන අගය (Last Row Value) ලබා ගැනීම
    //   finalY = doc.lastAutoTable.finalY + 5;
    //   doc.rect(10, finalY - 5, 195, 8); // Width 195
    //   doc.setFont("helvetica", "bold");
    //   doc.text("Total Amount in Words:", 13, finalY);
    //   doc.setFont("helvetica", "normal");

    //   // Array එකේ අවසාන අයිතමයේ value එක ගණන් වලට හැරවීම (උදා: include vat එකතුව)
    //   const lastRowValue =
    //     q.editExtraRows && q.editExtraRows.length > 0
    //       ? q.editExtraRows[q.editExtraRows.length - 1].value
    //       : 0;

    //   const totalInWords = numberToWords(Math.floor(lastRowValue));
    //   doc.text(`${totalInWords}`, 55, finalY);
    // }

    finalY += 15;

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

    // doc.save(`Quotation_${q.invoiceNo}.pdf`);

    if (actionType === "print") {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save("Quatation_${q.invoiceNo}.pdf");
    }
  };

  const generateSummaryPDF = (q, actionType) => {
    const doc = new jsPDF();

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
        // doc.addImage(headerImg, "JPEG", 30, 10, 150, 25);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.rect(65, 40.5, 80, 6);
        doc.text((q.invoiceType || "QUOTATION").toUpperCase(), 105, 14.5, {
          align: "center",
        });
        // doc.setFontSize(8);
        // doc.text("DUPLICATE", 195, 45, { align: "right" });
      }
    };

    drawPageBorder();
    drawHeader(true);

    let startY = 22.5;
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
      ? new Date(q.date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";
    doc.text(`Date of Quotation:    ${formattedDate1}`, 11, startY + 3.5);

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
          .map((d) =>
            new Date(d).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            }),
          )
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
      11,
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
                } else {
                  let finalDescription = displayDesc;

                  // 1. "P" අකුරෙන් පටන් ගන්නේදැයි පරීක්ෂා කිරීම
                  if (item.desc.trim().startsWith("P")) {
                    const words = item.desc.split(" "); // වචන වලට වෙන් කිරීම

                    // 2. මුල් වචන දෙක පමණක් ගැනීම (උදා: "P3.91 Outdoor")
                    const firstTwoWords = words.slice(0, 2).join(" ");

                    // 3. අලුත් Format එක සැකසීම
                    finalDescription = `${firstTwoWords} HD Quality LED Screen (${w}' x ${h}') , ${qty}Qty`;
                  }

                  tableRows.push([
                    `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`,
                    finalDescription, // මෙතනට අලුතින් සැකසූ description එක ලබා දෙනවා
                    totalCalculatedQty.toLocaleString(),
                    priceToDisplay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                    itemTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                  ]);
                  subItemCounter++;
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

    // දත්ත පරීක්ෂාව (Condition)
    if (q.totalLEDLightingSoundStageTruss > 0) {
      const totalLEDGroup = q.totalLEDLightingSoundStageTruss; // 42500
      // const ledDiscount = q.discountTotalLEDLightingSoundStageTruss; // 21250
      // const afterDiscount = totalLEDGroup - ledDiscount; // 21250

      autoTable(doc, {
        startY: finalY,
        body: [
          // 1. Header Row
          [
            {
              content: `SUMMARY FOR LED, LIGHTING, SOUND, STAGE & TRUSS`,
              colSpan: 5,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],

          // 2. Total Amount Row
          [
            {
              content: `Total Amount for LED, Light, Sound, Stage & Truss`,
              colSpan: 3,
              styles: { fontStyle: "bold" },
            },
            { content: `Rs.`, styles: { halign: "right", fontStyle: "bold" } },
            {
              content: totalLEDGroup.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { halign: "right", fontStyle: "bold" },
            },
          ],
          // 3. Discount Row
          [
            {
              content: `Less: Special Discount / Sponsorship`,
              colSpan: 3,
              styles: { fontStyle: "bold", textColor: [211, 47, 47] },
            },
            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                textColor: [211, 47, 47],
              },
            },
            {
              content: `${q.discountTotalLEDLightingSoundStageTruss.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                textColor: [211, 47, 47],
              },
            },
          ],

          // 4. Net Amount Row (After Discount)
          [
            {
              content: `After Discount Amount `,
              colSpan: 3,
              styles: { fontStyle: "bold", fillColor: [245, 245, 245] },
            },
            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [245, 245, 245],
              },
            },
            {
              content: (
                totalLEDGroup - q.discountTotalLEDLightingSoundStageTruss
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [245, 245, 245],
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

    categoriesOther.forEach((cat) => {
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
                  displayDesc = `${item.desc} - ${days} Days - ${qty} Qty`;
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
    if (
      q.invoiceType === "Commercial Invoice" ||
      q.invoiceType === "Normal Invoice" ||
      q.invoiceType === "Tax Invoice" ||
      (q.invoiceType === "Proforma Invoice" &&
        q.proformaCategory === "Quotation Type")
    ) {
      if (q.quotationCategory === "Normal Quotation") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              `${q.totalValueOfSupply.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        const totalInWords = numberToWords(Math.floor(q.subTotal));
        doc.text(`${totalInWords}`, 55, finalY);
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash", 45, finalY);
      } else if (q.quotationCategory === "Normal Quotation with Discount") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Sub Total Amount ",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Less: Special Discount ",
              "Rs.",
              `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Grand Total Amount ",
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

        finalY = doc.lastAutoTable.finalY + 5;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Total Amount in Words:", 13, finalY);
        doc.setFont("helvetica", "normal");
        const totalInWords = numberToWords(
          Math.floor(q.subTotal - (q.discount || 0)),
        );
        doc.text(`${totalInWords}`, 55, finalY);

        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash", 45, finalY);
      } else if (q.quotationCategory === "Vat Quotation") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Total Value of Supply",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              `${(q.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Amount Including VAT ",
              "Rs.",
              `${(q.subTotal + (q.vat || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        const totalInWords = numberToWords(
          Math.floor(q.subTotal + (q.vat || 0)),
        );
        doc.text(`${totalInWords}`, 55, finalY);

        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cheque in favour of", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 71, finalY);
      } else if (q.quotationCategory === "Vat Quotation with Discount") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Sub Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],

            [
              "Less: Special Discount",
              "Rs.",
              `${q.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Value of Supply",
              "Rs.",
              `${q.totalValueOfSupply.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              `${(q.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Amount Including VAT ",
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
        doc.text("Cheque in favour of ", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 72, finalY);
      } else if (q.quotationCategory === "Normal Quotation More Days") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        doc.text("Cash ", 45, finalY);
      }
    } else if (
      q.invoiceType === "Proforma Invoice" &&
      q.proformaCategory === "Requesting Advance"
    ) {
      if (q.quotationCategory === "Normal Quotation") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              `${q.totalValueOfSupply.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        const totalInWords = numberToWords(Math.floor(q.subTotal));
        doc.text(`${totalInWords}`, 55, finalY);
        finalY += 12;
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash", 45, finalY);
      } else if (q.quotationCategory === "Normal Quotation with Discount") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Sub Total Amount ",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Less: Special Discount ",
              "Rs.",
              `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Grand Total Amount ",
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

        finalY = doc.lastAutoTable.finalY + 5;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Total Amount in Words:", 13, finalY);
        doc.setFont("helvetica", "normal");
        const totalInWords = numberToWords(
          Math.floor(q.subTotal - (q.discount || 0)),
        );
        doc.text(`${totalInWords}`, 55, finalY);
        finalY += 12;
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash", 45, finalY);
      } else if (q.quotationCategory === "Vat Quotation") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Total Value of Supply",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              `${(q.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Amount Including VAT ",
              "Rs.",
              `${(q.subTotal + (q.vat || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        const totalInWords = numberToWords(
          Math.floor(q.subTotal + (q.vat || 0)),
        );
        doc.text(`${totalInWords}`, 55, finalY);
        finalY += 12;
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cheque in favour of", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 71, finalY);
      } else if (q.quotationCategory === "Vat Quotation with Discount") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Sub Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],

            [
              "Less: Special Discount",
              "Rs.",
              `${q.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Value of Supply",
              "Rs.",
              `${q.totalValueOfSupply.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              `${(q.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            ],
            [
              "Total Amount Including VAT ",
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
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cheque in favour of ", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 72, finalY);
      } else if (q.quotationCategory === "Normal Quotation More Days") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash ", 45, finalY);
      }
    }
    // else if (q.quotationCategory === "edit") {
    //   // 1. Database එකේ ඇති editExtraRows Array එක table එකට ගැලපෙන ලෙස සකස් කිරීම
    //   const editRowsBody = (q.editExtraRows || []).map((row) => [
    //     row.label, // "Total Amount", "vat valu", "include vat" වැනි labels
    //     "Rs.",
    //     Number(row.value).toLocaleString(undefined, {
    //       minimumFractionDigits: 2,
    //     }), // අගය formatting කිරීම
    //   ]);

    //   // 2. Dynamic Table එක නිර්මාණය කිරීම
    //   autoTable(doc, {
    //     startY: finalY,
    //     body: editRowsBody, // මෙතනට සකස් කරගත් Rows ලබා දෙනවා
    //     theme: "grid",
    //     styles: {
    //       fontSize: 8,
    //       fontStyle: "bold",
    //       lineColor: [0, 0, 0],
    //       lineWidth: 0.2,
    //     },
    //     columnStyles: footerColStyles,
    //     margin: { left: 10 },
    //   });

    //   // 3. "Total Amount in Words" කොටස සඳහා අවසාන අගය (Last Row Value) ලබා ගැනීම
    //   finalY = doc.lastAutoTable.finalY + 5;
    //   doc.rect(10, finalY - 5, 195, 8); // Width 195
    //   doc.setFont("helvetica", "bold");
    //   doc.text("Total Amount in Words:", 13, finalY);
    //   doc.setFont("helvetica", "normal");

    //   // Array එකේ අවසාන අයිතමයේ value එක ගණන් වලට හැරවීම (උදා: include vat එකතුව)
    //   const lastRowValue =
    //     q.editExtraRows && q.editExtraRows.length > 0
    //       ? q.editExtraRows[q.editExtraRows.length - 1].value
    //       : 0;

    //   const totalInWords = numberToWords(Math.floor(lastRowValue));
    //   doc.text(`${totalInWords}`, 55, finalY);
    // }

    finalY += 15;

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

    // doc.save(`Quotation_${q.invoiceNo}.pdf`);

    if (actionType === "print") {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save("Quatation_${q.invoiceNo}.pdf");
    }
  };

  const generateMultiDaysPDF = (q, actionType) => {
    const doc = new jsPDF();

    const drawPageBorder = () => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("IMAGINE ENTERTAINMENT (PVT) LTD", 105, 292, {
        align: "center",
      });
      doc.text((q.invoiceType || "QUOTATION").toUpperCase(), 105, 14.5, {
        align: "center",
      });
    };

    const drawHeader = (isFirstPage) => {
      if (isFirstPage) {
        // Header එක මැදට ගැනීම (Page Width 210 - Image Width 150) / 2 = 30

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
      ? new Date(q.date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";
    doc.text(`Date of Quotation:    ${formattedDate1}`, 11, startY + 3.5);

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
          .map((d) =>
            new Date(d).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            }),
          )
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
      11,
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
                } else {
                  let finalDescription = displayDesc;

                  // 1. "P" අකුරෙන් පටන් ගන්නේදැයි පරීක්ෂා කිරීම
                  if (item.desc.trim().startsWith("P")) {
                    const words = item.desc.split(" "); // වචන වලට වෙන් කිරීම

                    // 2. මුල් වචන දෙක පමණක් ගැනීම (උදා: "P3.91 Outdoor")
                    const firstTwoWords = words.slice(0, 2).join(" ");

                    // 3. අලුත් Format එක සැකසීම
                    finalDescription = `${firstTwoWords} HD Quality LED Screen (${w}' x ${h}') , ${qty}Qty`;
                  }

                  tableRows.push([
                    `${activeCategoryCounter}.${subIdx + 1}.${subItemCounter}`,
                    finalDescription, // මෙතනට අලුතින් සැකසූ description එක ලබා දෙනවා
                    totalCalculatedQty.toLocaleString(),
                    priceToDisplay.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                    itemTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    }),
                  ]);
                  subItemCounter++;
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

    // දත්ත පරීක්ෂාව (Condition)
    // --- 🟢 SUMMARY FOR LED, LIGHTING, SOUND, STAGE & TRUSS (Multi-Day Logic) ---

    // 1. අවශ්‍ය අගයන් ලබා ගැනීම
    const totalLEDGroupBeforeDiscount =
      Number(q.totalLEDLightingSoundStageTruss) || 0;
    const ledDiscount = Number(q.discountTotalLEDLightingSoundStageTruss) || 0;
    const ledNetPayable = totalLEDGroupBeforeDiscount - ledDiscount;

    // 2. Table එකට අවශ්‍ය පේළි (Rows) සකස් කිරීම
    const breakdownRows = [];

    // A. Rehearsal පේළිය ඇතුළත් කිරීම (දිනයක් තිබේ නම් පමණක්)
    if (q.rehearsalDay) {
      breakdownRows.push([
        { content: "1", styles: { halign: "center" } },
        {
          content: `${q.rehearsalDiscountPercent}% Rehearsal Day (${q.rehearsalDay})`,
        },
        { content: "" },
        { content: "Rs.", styles: { halign: "right" } },
        {
          content: Number(q.rehearsalAmount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          }),
          styles: { halign: "right", fontStyle: "bold" },
        },
      ]);
    }

    // B. Event Days පේළි ඇතුළත් කිරීම (eventDate array එක පාවිච්චි කරමින්)
    if (Array.isArray(q.eventDate)) {
      q.eventDate.forEach((day, idx) => {
        // Rehearsal එක තිබ්බොත් index එක 2න් පටන් ගන්නවා, නැත්නම් 1න්
        const rowNo = q.rehearsalDay ? idx + 2 : idx + 1;

        breakdownRows.push([
          { content: `${rowNo}`, styles: { halign: "center" } },
          { content: `${day.percentage}% Day ${idx + 1} (${day.date})` },
          { content: "" },
          { content: "Rs.", styles: { halign: "right" } },
          {
            content: Number(day.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
            styles: { halign: "right", fontStyle: "bold" },
          },
        ]);
      });
    }

    // 3. දැන් Table එක PDF එකට ඇඳීම
    if (breakdownRows.length > 0) {
      autoTable(doc, {
        startY: finalY,
        body: [
          // Header Row
          [
            {
              content: `SUMMARY FOR LED, LIGHTING, SOUND, STAGE & TRUSS SYSTEMS`,
              colSpan: 5,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [230, 230, 230],
              },
            },
          ],
          // සකස් කරගත් පේළි (Rehearsal + Event Days)
          ...breakdownRows,
          // Total Amount (Before Discount)
          [
            {
              content: `Total Amount for Rehearsal & Event days`,
              colSpan: 3,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fillColor: [245, 245, 245],
              },
            },
            {
              content: `Rs.`,
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [245, 245, 245],
              },
            },
            {
              content: (() => {
                // 1. eventDate array එකේ ඇති amount සියල්ල එකතු කිරීම
                const eventTotal = q.eventDate.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );

                // 2. ඒකට rehearsalAmount එකත් එකතු කිරීම
                const grandSum = eventTotal + (Number(q.rehearsalAmount) || 0);

                // 3. ලැබෙන මුළු අගය format කර පෙන්වීම
                return grandSum.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              })(),
              styles: {
                halign: "right",
                fontStyle: "bold",
                fillColor: [245, 245, 245],
              },
            },
          ],
          // Less: Special Discount (තිබේ නම් පමණි)
          ...(q.discount > 0
            ? [
                [
                  {
                    content: `Less: Special Discount / Sponsorship`,
                    colSpan: 3,
                    styles: {
                      halign: "left",
                      fontStyle: "bold",
                      textColor: [211, 47, 47],
                    },
                  },
                  {
                    content: `Rs.`,
                    styles: {
                      halign: "right",
                      fontStyle: "bold",
                      textColor: [211, 47, 47],
                    },
                  },
                  {
                    content: `${q.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    styles: {
                      halign: "right",
                      fontStyle: "bold",
                      textColor: [211, 47, 47],
                    },
                  },
                ],

                [
                  {
                    content: `After Discount Amount`,
                    colSpan: 3,
                    styles: {
                      halign: "left",
                      fontStyle: "bold",
                      fillColor: [232, 245, 233],
                    },
                  },
                  {
                    content: `Rs.`,
                    styles: {
                      halign: "right",
                      fontStyle: "bold",
                      fillColor: [232, 245, 233],
                    },
                  },
                  {
                    content: (() => {
                      // 1. eventDate array එකේ ඇති amount සියල්ල එකතු කිරීම
                      const eventTotal = q.eventDate.reduce(
                        (sum, item) => sum + (Number(item.amount) || 0),
                        0,
                      );

                      // 2. ඒකට rehearsalAmount එකත් එකතු කිරීම
                      const grandSum =
                        eventTotal + (Number(q.rehearsalAmount) || 0);

                      // 3. ලැබෙන මුළු අගය format කර පෙන්වීම
                      return (grandSum - q.discount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      });
                    })(),
                    styles: {
                      halign: "right",
                      fontStyle: "bold",
                      fillColor: [232, 245, 233],
                      fontSize: 8,
                    },
                  },
                ],
              ]
            : []),
          // Final Net Amount Row
        ],
        theme: "grid",
        styles: { fontSize: 7, lineColor: [0, 0, 0], lineWidth: 0.1 },
        columnStyles: {
          0: { cellWidth: 15 }, // Ref
          1: { cellWidth: 95 }, // Description (Day + Date)
          2: { cellWidth: 15 }, // Empty
          3: { cellWidth: 30 }, // Rs.
          4: { cellWidth: 40 }, // Amount
        },
        margin: { left: 10 },
      });

      finalY = doc.lastAutoTable.finalY + 10;
    }

    categoriesOther.forEach((cat) => {
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
                  displayDesc = `${item.desc} - ${days} Days - ${qty} Qty`;
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
    if (
      q.invoiceType === "Commercial Invoice" ||
      q.invoiceType === "Normal Invoice" ||
      q.invoiceType === "Tax Invoice" ||
      (q.invoiceType === "Proforma Invoice" &&
        q.proformaCategory === "Quotation Type")
    ) {
      if (q.quotationCategory === "Vat Quotation More Days") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Total Value of Supply",
              "Rs.",
              (() => {
                // 1. LED Group එකේ දවස් ටිකේ එකතුව (Rehearsal + Event Days)
                const eventTotal = q.eventDate.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );
                const ledGrandSum =
                  eventTotal + (Number(q.rehearsalAmount) || 0);

                // 2. අනෙක් පද්ධතිවල (Other Systems) එකතුව
                // මේ පද්ධති දත්ත කෙලින්ම q object එකෙන් ගණනය කරමු
                const otherSystemsTotal =
                  q.subTotal - q.totalLEDLightingSoundStageTruss;

                // 3. අවසාන එකතුව = (LED Group Sum - Overall Discount) + Other Systems
                const finalGrandTotal =
                  ledGrandSum - (Number(q.discount) || 0) + otherSystemsTotal;

                return finalGrandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              })(),
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              (() => {
                // 1. LED Group එකේ දවස් ටිකේ එකතුව (Rehearsal + Event Days)
                const eventTotal = q.eventDate.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );
                const ledGrandSum =
                  eventTotal + (Number(q.rehearsalAmount) || 0);

                // 2. අනෙක් පද්ධතිවල (Other Systems) එකතුව
                // මේ පද්ධති දත්ත කෙලින්ම q object එකෙන් ගණනය කරමු
                const otherSystemsTotal =
                  q.subTotal - q.totalLEDLightingSoundStageTruss;

                // 3. අවසාන එකතුව = (LED Group Sum - Overall Discount) + Other Systems
                const finalGrandTotal =
                  ledGrandSum - (Number(q.discount) || 0) + otherSystemsTotal;

                return (finalGrandTotal * 0.18).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              })(),
            ],
            [
              "Total Amount Including VAT ",
              "Rs.",
              (() => {
                // 1. LED Group එකේ දවස් ටිකේ එකතුව (Rehearsal + Event Days)
                const eventTotal = q.eventDate.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );
                const ledGrandSum =
                  eventTotal + (Number(q.rehearsalAmount) || 0);

                // 2. අනෙක් පද්ධතිවල (Other Systems) එකතුව
                // මේ පද්ධති දත්ත කෙලින්ම q object එකෙන් ගණනය කරමු
                const otherSystemsTotal =
                  q.subTotal - q.totalLEDLightingSoundStageTruss;

                // 3. අවසාන එකතුව = (LED Group Sum - Overall Discount) + Other Systems
                const finalGrandTotal =
                  ledGrandSum - (Number(q.discount) || 0) + otherSystemsTotal;

                return (
                  finalGrandTotal * 0.18 +
                  finalGrandTotal
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              })(),
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

        const eventTotalForWords = q.eventDate.reduce(
          (sum, item) => sum + (Number(item.amount) || 0),
          0,
        );
        const otherTotalForWords =
          q.subTotal - q.totalLEDLightingSoundStageTruss;
        const finalAmtForWords =
          eventTotalForWords +
          (Number(q.rehearsalAmount) || 0) -
          (Number(q.discount) || 0) +
          otherTotalForWords;

        const totalInWords = numberToWords(
          Math.floor(finalAmtForWords * 0.18 + finalAmtForWords),
        );
        doc.text(`${totalInWords}`, 55, finalY);

        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);

        doc.setFont("helvetica", "normal");
        doc.text("Cheque in favour of", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 71, finalY);
      } else if (q.quotationCategory === "Normal Quotation More Days") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              (() => {
                // 1. LED Group එකේ දවස් ටිකේ එකතුව (Rehearsal + Event Days)
                const eventTotal = q.eventDate.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );
                const ledGrandSum =
                  eventTotal + (Number(q.rehearsalAmount) || 0);

                // 2. අනෙක් පද්ධතිවල (Other Systems) එකතුව
                // මේ පද්ධති දත්ත කෙලින්ම q object එකෙන් ගණනය කරමු
                const otherSystemsTotal =
                  q.subTotal - q.totalLEDLightingSoundStageTruss;

                // 3. අවසාන එකතුව = (LED Group Sum - Overall Discount) + Other Systems
                const finalGrandTotal =
                  ledGrandSum - (Number(q.discount) || 0) + otherSystemsTotal;

                return finalGrandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              })(),
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

        const eventTotalForWords = q.eventDate.reduce(
          (sum, item) => sum + (Number(item.amount) || 0),
          0,
        );
        const otherTotalForWords =
          q.subTotal - q.totalLEDLightingSoundStageTruss;
        const finalAmtForWords =
          eventTotalForWords +
          (Number(q.rehearsalAmount) || 0) -
          (Number(q.discount) || 0) +
          otherTotalForWords;

        const totalInWords = numberToWords(Math.floor(finalAmtForWords));
        doc.text(`${totalInWords}`, 55, finalY);

        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash ", 45, finalY);
      }
    } else if (
      q.invoiceType === "Proforma Invoice" &&
      q.proformaCategory === "Requesting Advance"
    ) {
      if (q.quotationCategory === "Vat Quotation More Days") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Total Value of Supply",
              "Rs.",
              (() => {
                // 1. LED Group එකේ දවස් ටිකේ එකතුව (Rehearsal + Event Days)
                const eventTotal = q.eventDate.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );
                const ledGrandSum =
                  eventTotal + (Number(q.rehearsalAmount) || 0);

                // 2. අනෙක් පද්ධතිවල (Other Systems) එකතුව
                // මේ පද්ධති දත්ත කෙලින්ම q object එකෙන් ගණනය කරමු
                const otherSystemsTotal =
                  q.subTotal - q.totalLEDLightingSoundStageTruss;

                // 3. අවසාන එකතුව = (LED Group Sum - Overall Discount) + Other Systems
                const finalGrandTotal =
                  ledGrandSum - (Number(q.discount) || 0) + otherSystemsTotal;

                return finalGrandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              })(),
            ],
            [
              "VAT Amount(Total Value of Supply @18%)",
              "Rs.",
              (() => {
                // 1. LED Group එකේ දවස් ටිකේ එකතුව (Rehearsal + Event Days)
                const eventTotal = q.eventDate.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );
                const ledGrandSum =
                  eventTotal + (Number(q.rehearsalAmount) || 0);

                // 2. අනෙක් පද්ධතිවල (Other Systems) එකතුව
                // මේ පද්ධති දත්ත කෙලින්ම q object එකෙන් ගණනය කරමු
                const otherSystemsTotal =
                  q.subTotal - q.totalLEDLightingSoundStageTruss;

                // 3. අවසාන එකතුව = (LED Group Sum - Overall Discount) + Other Systems
                const finalGrandTotal =
                  ledGrandSum - (Number(q.discount) || 0) + otherSystemsTotal;

                return (finalGrandTotal * 0.18).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              })(),
            ],
            [
              "Total Amount Including VAT ",
              "Rs.",
              (() => {
                // 1. LED Group එකේ දවස් ටිකේ එකතුව (Rehearsal + Event Days)
                const eventTotal = q.eventDate.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );
                const ledGrandSum =
                  eventTotal + (Number(q.rehearsalAmount) || 0);

                // 2. අනෙක් පද්ධතිවල (Other Systems) එකතුව
                // මේ පද්ධති දත්ත කෙලින්ම q object එකෙන් ගණනය කරමු
                const otherSystemsTotal =
                  q.subTotal - q.totalLEDLightingSoundStageTruss;

                // 3. අවසාන එකතුව = (LED Group Sum - Overall Discount) + Other Systems
                const finalGrandTotal =
                  ledGrandSum - (Number(q.discount) || 0) + otherSystemsTotal;

                return (
                  finalGrandTotal * 0.18 +
                  finalGrandTotal
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              })(),
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

        const eventTotalForWords = q.eventDate.reduce(
          (sum, item) => sum + (Number(item.amount) || 0),
          0,
        );
        const otherTotalForWords =
          q.subTotal - q.totalLEDLightingSoundStageTruss;
        const finalAmtForWords =
          eventTotalForWords +
          (Number(q.rehearsalAmount) || 0) -
          (Number(q.discount) || 0) +
          otherTotalForWords;

        const totalInWords = numberToWords(
          Math.floor(finalAmtForWords * 0.18 + finalAmtForWords),
        );
        doc.text(`${totalInWords}`, 55, finalY);
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);

        doc.setFont("helvetica", "normal");
        doc.text("Cheque in favour of", 45, finalY);
        doc.setFont("helvetica", "bolditalic");
        doc.text('"Imagine Entertainment (Pvt) Ltd"', 71, finalY);
      } else if (q.quotationCategory === "Normal Quotation More Days") {
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              "Grand Total Amount",
              "Rs.",
              (() => {
                // 1. LED Group එකේ දවස් ටිකේ එකතුව (Rehearsal + Event Days)
                const eventTotal = q.eventDate.reduce(
                  (sum, item) => sum + (Number(item.amount) || 0),
                  0,
                );
                const ledGrandSum =
                  eventTotal + (Number(q.rehearsalAmount) || 0);

                // 2. අනෙක් පද්ධතිවල (Other Systems) එකතුව
                // මේ පද්ධති දත්ත කෙලින්ම q object එකෙන් ගණනය කරමු
                const otherSystemsTotal =
                  q.subTotal - q.totalLEDLightingSoundStageTruss;

                // 3. අවසාන එකතුව = (LED Group Sum - Overall Discount) + Other Systems
                const finalGrandTotal =
                  ledGrandSum - (Number(q.discount) || 0) + otherSystemsTotal;

                return finalGrandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                });
              })(),
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

        const eventTotalForWords = q.eventDate.reduce(
          (sum, item) => sum + (Number(item.amount) || 0),
          0,
        );
        const otherTotalForWords =
          q.subTotal - q.totalLEDLightingSoundStageTruss;
        const finalAmtForWords =
          eventTotalForWords +
          (Number(q.rehearsalAmount) || 0) -
          (Number(q.discount) || 0) +
          otherTotalForWords;

        const totalInWords = numberToWords(Math.floor(finalAmtForWords));
        doc.text(`${totalInWords}`, 55, finalY);
        autoTable(doc, {
          startY: finalY,
          body: [
            [
              `Requesting ${q.advanceRequestedAmountPercent}% Advance Payment (Without VAT) `,
              "Rs.",
              `${q.advanceRequestedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`,
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
        finalY += 12;
        doc.rect(10, finalY - 5, 195, 8); // Width 195
        doc.setFont("helvetica", "bold");
        doc.text("Mode of Payment :", 13, finalY);
        doc.setFont("helvetica", "normal");
        doc.text("Cash ", 45, finalY);
      }
    }
    // else if (q.quotationCategory === "edit") {
    //   // 1. Database එකේ ඇති editExtraRows Array එක table එකට ගැලපෙන ලෙස සකස් කිරීම
    //   const editRowsBody = (q.editExtraRows || []).map((row) => [
    //     row.label, // "Total Amount", "vat valu", "include vat" වැනි labels
    //     "Rs.",
    //     Number(row.value).toLocaleString(undefined, {
    //       minimumFractionDigits: 2,
    //     }), // අගය formatting කිරීම
    //   ]);

    //   // 2. Dynamic Table එක නිර්මාණය කිරීම
    //   autoTable(doc, {
    //     startY: finalY,
    //     body: editRowsBody, // මෙතනට සකස් කරගත් Rows ලබා දෙනවා
    //     theme: "grid",
    //     styles: {
    //       fontSize: 8,
    //       fontStyle: "bold",
    //       lineColor: [0, 0, 0],
    //       lineWidth: 0.2,
    //     },
    //     columnStyles: footerColStyles,
    //     margin: { left: 10 },
    //   });

    //   // 3. "Total Amount in Words" කොටස සඳහා අවසාන අගය (Last Row Value) ලබා ගැනීම
    //   finalY = doc.lastAutoTable.finalY + 5;
    //   doc.rect(10, finalY - 5, 195, 8); // Width 195
    //   doc.setFont("helvetica", "bold");
    //   doc.text("Total Amount in Words:", 13, finalY);
    //   doc.setFont("helvetica", "normal");

    //   // Array එකේ අවසාන අයිතමයේ value එක ගණන් වලට හැරවීම (උදා: include vat එකතුව)
    //   const lastRowValue =
    //     q.editExtraRows && q.editExtraRows.length > 0
    //       ? q.editExtraRows[q.editExtraRows.length - 1].value
    //       : 0;

    //   const totalInWords = numberToWords(Math.floor(lastRowValue));
    //   doc.text(`${totalInWords}`, 55, finalY);
    // }

    finalY += 15;

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

    // doc.save(`Quotation_${q.invoiceNo}.pdf`);

    if (actionType === "print") {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save("Quatation_${q.invoiceNo}.pdf");
    }
  };

  // 1. Database එකෙන් දත්ත ලබා ගැනීම
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get("http://localhost:5000https://imagine-entertainment-invoice-system.onrender.com/api/quotations");
        // ඉන්වොයිස් අංකයක් (quotationNo) ඇති දත්ත පමණක් පෙරීම
        const invoicesOnly = res.data.filter((q) => q.quotationNo);
        setAllInvoices(invoicesOnly);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      }
    };
    fetchInvoices();
  }, []);
  const stats = {
    tax: allInvoices.filter((inv) => inv.invoiceType === "Tax Invoice").length,
    proforma: allInvoices.filter(
      (inv) => inv.invoiceType === "Proforma Invoice",
    ).length,
    commercial: allInvoices.filter(
      (inv) => inv.invoiceType === "Commercial Invoice",
    ).length,
    normal: allInvoices.filter((inv) => inv.invoiceType === "Normal Invoice")
      .length,
  };
  return (
    <div className="dashboard-container" style={{ padding: "20px" }}>
      <h2>Generated Commercial Invoices</h2>

      <div
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div className="stat-card blue">
          <h3>Commercial Invoices</h3>
          <p className="value">
            {stats.commercial.toString().padStart(2, "0")}
          </p>
        </div>
      </div>
      <div className="table-scroll-container">
        <table
          className="db-table"
          style={{ width: "100%", marginTop: "20px" }}
        >
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice NO</th>
              <th>Client Name</th>
              <th>Company</th>
              <th>Grand Total</th>
              <th>Invoice Type</th>
              <th>Download</th>
              <th>Print</th>
            </tr>
          </thead>
          <tbody>
            {/* 🟢 මෙතනදී .filter() එක භාවිතා කරලා Commercial Invoice විතරක් තෝරාගන්නවා */}
            {allInvoices.filter(
              (inv) => inv.invoiceType === "Commercial Invoice",
            ).length > 0 ? (
              allInvoices
                .filter((inv) => inv.invoiceType === "Commercial Invoice") // පෙරා ගැනීම
                .map((inv, index) => (
                  <tr key={index}>
                    <td>{inv.date}</td>
                    <td>{inv.invoiceNo}</td>
                    <td>{inv.ClientName}</td>
                    <td>{inv.companyName}</td>
                    <td>Rs. {inv.grandTotal?.toLocaleString()}</td>
                    <td>{inv.invoiceType}</td>
                    <td>
                      <button
                        className="btn-download"
                        onClick={() => generatePDF(inv, "download")}
                      >
                        Download
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-print"
                        style={{
                          backgroundColor: "#4A5568",
                          color: "white",
                          padding: "5px 10px",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          generatePDF(inv, "print");
                        }}
                      >
                        print
                      </button>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No Tax Invoices Found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
      </div>
    </div>
  );
}
