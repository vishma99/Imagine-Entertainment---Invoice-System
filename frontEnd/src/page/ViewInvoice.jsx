import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ViewInvoice() {
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
  const handleStatusChange = async (id, fieldName, newStatus) => {
    let extraData = {};

    if (fieldName === "invoiceFooterType" && newStatus === "Proforma Invoice") {
      const inv = allInvoices.find((i) => i._id === id);

      // Summary හෝ Normal අනුව Total එක තෝරා ගැනීම
      const currentTotal =
        inv.nomal === 0 ? inv.calculatedGrandSubTotal || 0 : inv.subTotal || 0;

      const { value: formValues } = await Swal.fire({
        title: "Proforma Invoice Details",
        html:
          `<div style="text-align: left; font-size: 14px; font-family: 'Segoe UI', sans-serif;">` +
          `<p style="margin-bottom: 15px;"><b>Total Amount per Day:</b> <span style="color: #2b6cb0;">Rs. ${currentTotal.toLocaleString()}</span></p>` +
          `<div style="margin-bottom: 15px;">` +
          `<label style="display: block; margin-bottom: 5px; font-weight: bold;">Sponsorship Amount (Value or %):</label>` +
          `<input id="swal-discount" class="swal2-input" style="width: 100%; margin: 0;" placeholder="e.g. 5000 or 10%">` +
          `</div>` +
          `<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">` +
          `<label style="font-weight: bold;">How many days:</label>` +
          `<input id="swal-days" type="number" class="swal2-input" style="width: 80px; margin: 0;" value="1" min="1">` +
          `</div>` +
          `<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">` +
          `<label style="font-weight: bold;">Requesting Amount (%):</label>` +
          `<div style="display: flex; align-items: center;">` +
          `<input id="swal-req-amount" type="number" class="swal2-input" style="width: 70px; margin: 0; text-align: center;" value="100" min="1" max="100">` +
          `<span style="margin-left: 5px; font-weight: bold;">%</span>` +
          `</div>` +
          `</div>` +
          `</div>`,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
          const discountInput = document.getElementById("swal-discount").value;
          const daysInput = document.getElementById("swal-days").value;
          const reqAmountInput =
            document.getElementById("swal-req-amount").value;

          if (!reqAmountInput || reqAmountInput <= 0 || reqAmountInput > 100) {
            Swal.showValidationMessage(
              `Please enter a valid percentage (1-100)`,
            );
            return false;
          }

          return {
            discount: discountInput,
            days: daysInput,
            requestingAmount: reqAmountInput,
          };
        },
      });

      if (formValues) {
        let discountVal = 0;
        // Discount එක % එකක්ද කියා පරීක්ෂා කර අගය ගණනය කිරීම
        if (formValues.discount.includes("%")) {
          let percent = parseFloat(formValues.discount.replace("%", ""));
          discountVal = (currentTotal * percent) / 100;
        } else {
          discountVal = parseFloat(formValues.discount) || 0;
        }

        // --- ඔබේ නව Schema Field නම් මෙතැනට ආදේශ කර ඇත ---
        extraData = {
          performancecustomDiscount: discountVal,
          performancecustomDays: parseInt(formValues.days) || 1,
          performancerequestingAmount:
            parseInt(formValues.requestingAmount) || 100,
          performanceperDayTotal: currentTotal,
        };
      } else {
        return; // Cancel කළොත් ඉදිරියට නොයයි
      }
    }

    // --- Tax Invoice සඳහා Pop-up එක ---
    else if (fieldName === "invoiceFooterType" && newStatus === "Tax Invoice") {
      const inv = allInvoices.find((i) => i._id === id);

      // Summary හෝ Normal අනුව Total එක තෝරා ගැනීම
      const currentTotal =
        inv.nomal === 0 ? inv.calculatedGrandSubTotal || 0 : inv.subTotal || 0;

      const { value: formValues } = await Swal.fire({
        title: "Tax Invoice Details",
        html:
          `<div style="text-align: left; font-size: 14px; font-family: 'Segoe UI', sans-serif;">` +
          `<p style="margin-bottom: 15px;"><b>Total Amount per Episode:</b> <span style="color: #2b6cb0;">Rs. ${currentTotal.toLocaleString()}</span></p>` +
          `<div style="margin-bottom: 15px;">` +
          `<label style="display: block; margin-bottom: 5px; font-weight: bold;">Discount for Per Episode (Value or %):</label>` +
          `<input id="swal-tax-discount" class="swal2-input" style="width: 100%; margin: 0;" placeholder="e.g. 2000 or 5%">` +
          `</div>` +
          `<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">` +
          `<label style="font-weight: bold;">How many Episodes:</label>` +
          `<input id="swal-tax-episodes" type="number" class="swal2-input" style="width: 80px; margin: 0;" value="1" min="1">` +
          `</div>` +
          `<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">` +
          `<label style="font-weight: bold;">Advance Payment (%):</label>` +
          `<div style="display: flex; align-items: center;">` +
          `<input id="swal-tax-advance" type="number" class="swal2-input" style="width: 70px; margin: 0; text-align: center;" value="50" min="1" max="100">` +
          `<span style="margin-left: 5px; font-weight: bold;">%</span>` +
          `</div>` +
          `</div>` +
          `</div>`,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
          return {
            discount: document.getElementById("swal-tax-discount").value,
            episodes: document.getElementById("swal-tax-episodes").value,
            advance: document.getElementById("swal-tax-advance").value,
          };
        },
      });

      if (formValues) {
        let discountVal = 0;
        if (formValues.discount.includes("%")) {
          let percent = parseFloat(formValues.discount.replace("%", ""));
          discountVal = (currentTotal * percent) / 100;
        } else {
          discountVal = parseFloat(formValues.discount) || 0;
        }

        extraData = {
          taxcustomDiscount: discountVal,
          taxcustomEpisodes: parseInt(formValues.episodes) || 1,
          taxadvancePercentage: parseInt(formValues.advance) || 50,
          taxperEpisodeTotal: currentTotal,
        };
      } else {
        return; // Cancel කළොත් update වෙන්නේ නැත
      }
    }

    try {
      // Backend API Update
      const response = await axios.put(
        `http://localhost:5000/api/quotations/${id}`,
        {
          [fieldName]: newStatus,
          ...extraData,
        },
      );

      if (response.status === 200) {
        // Local state එක Update කිරීම
        const updatedInvoices = allInvoices.map((inv) => {
          if (inv._id === id) {
            // අලුත් දත්ත පවතින inv එකට එකතු කිරීම
            return { ...inv, [fieldName]: newStatus, ...extraData };
          }
          return inv;
        });

        setAllInvoices(updatedInvoices);
        localStorage.setItem("invoices", JSON.stringify(updatedInvoices));

        Swal.fire({
          icon: "success",
          title: "Updated Successfully",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Update Error:", err);
      Swal.fire("Error!", "Could not update the database.", "error");
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
  const generatePDF = (q, actionType = "download") => {
    if (q.nomal === 0) {
      generateSummaryPDF(q, actionType);
    } else {
      generateNormalPDF(q, actionType);
    }
  };

  const generateNormalPDF = (q, actionType) => {
    const doc = new jsPDF();
    // const headerImg = "/image/header.jpeg";

    const drawPageBorder = () => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("IMAGINE ENTERTAINMENT (PVT) LTD", 105, 292, {
        align: "center",
      });
      doc.text("INV NO: " + q.invoiceNo, 10, 292, { align: "left" }); // Margin එකට ගැලපුවා
    };

    const drawHeader = (isFirstPage) => {
      if (isFirstPage) {
        // Header එක මැදට ගැනීම (Page Width 210 - Image Width 150) / 2 = 30
        // doc.addImage(headerImg, "JPEG", 30, 10, 150, 25);
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
    doc.text(`Date of Invoice:    ${formattedDate1}`, 11, startY + 3.5);

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
    doc.text(
      `${q.invoiceType || "QUOTATION"} No:   ${q.quotationNo || ""}`,
      111,
      startY + 3.5,
    );
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
      const ledDiscount = q.discountTotalLEDLightingSoundStageTruss; // 21250
      const afterDiscount = totalLEDGroup - ledDiscount; // 21250

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
              content: `(${ledDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
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
              content: afterDiscount.toLocaleString(undefined, {
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

    if (q.invoiceFooterType === "Proforma Invoice") {
      // Database එකෙන් අගයන් ලබා ගැනීම (නැතිනම් default අගයන් භාවිතා වේ)
      const perDayAmount = q.performanceperDayTotal || 0;
      const days = q.performancecustomDays || 1;
      const sponsorshipPerDay = q.performancecustomDiscount || 0;
      const reqPercent = q.performancerequestingAmount || 100;

      // ගණනය කිරීම්
      const sponsorshipPercent =
        perDayAmount > 0
          ? ((sponsorshipPerDay / perDayAmount) * 100).toFixed(1)
          : 0;
      const subTotalPerDay = perDayAmount - sponsorshipPerDay;
      const totalValueOfSupply = subTotalPerDay * days;
      const vatAmount = totalValueOfSupply * 0.18;
      const totalWithVat = totalValueOfSupply + vatAmount;

      // Advance Payment (Without VAT) - Total Value of Supply එකෙන් Requesting % එක
      const advancePaymentAmount = (totalValueOfSupply * reqPercent) / 100;

      // 1. ප්‍රධාන ගණන් පෙන්වන වගුව
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Total Amount - Per Day",
            "Rs.",
            perDayAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            `Less: ${sponsorshipPercent}% Sponsorship Amount for Per Day`,
            "Rs.",
            sponsorshipPerDay.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            "Sub Total Amount - Per Day",
            "Rs.",
            subTotalPerDay.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            `Total Value of Supply: (${days} Day Charges)`,
            "Rs.",
            totalValueOfSupply.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
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

      // 2. VAT වගුව
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 2,
        body: [
          [
            "VAT Amount (Total Value of Supply @ 18%)",
            "Rs.",
            vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
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

      // 3. මුළු එකතුව (Grand Total)
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 2,
        body: [
          [
            "Total Amount including VAT",
            "Rs.",
            totalWithVat.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
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

      // මුළු මුදල වචනයෙන්
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount in Words:", 13, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(`${numberToWords(Math.floor(totalWithVat))}`, 55, finalY);

      // 4. Advance Payment කොටස (Requesting Amount)
      // --- 4. Advance Payment Section (Requesting Amount) ---

      // Advance Payment වගුව
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        body: [
          [
            {
              content: `Requesting ${reqPercent}% Advance Payment (Without VAT)`,
              styles: { halign: "left" },
            },
            "Rs.",
            {
              content: advancePaymentAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { halign: "right" },
            },
          ],
        ],
        theme: "grid",
        styles: {
          fontSize: 8,
          fontStyle: "bold",
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          fillColor: [230, 230, 230], // කලින් Summary breakdown එකේ වගේ ලා අළු පැහැය
        },
        columnStyles: footerColStyles,
        margin: { left: 10 },
      });

      // Advance Payment වචනයෙන් (Amount in words)
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8); // මුළු පළලටම Border එක
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Amount in words:", 13, finalY);

      doc.setFont("helvetica", "normal");
      const advanceInWords = numberToWords(Math.floor(advancePaymentAmount));
      doc.text(`${advanceInWords}`, 40, finalY);

      finalY += 10; // ඊළඟ කොටස සඳහා ඉඩ තැබීම
    } else if (q.invoiceFooterType === "VAT All") {
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
    } else if (q.invoiceFooterType === "Tax Invoice") {
      // Database එකේ ඇති අලුත් Fields ලබා ගැනීම
      const perEpisodeAmount = q.taxperEpisodeTotal || 0;
      const episodes = q.taxcustomEpisodes || 1;
      const discountPerEpisode = q.taxcustomDiscount || 0;
      const advancePercent = q.taxadvancePercentage || 50;

      // --- ගණනය කිරීම් (Calculations) ---
      // 1. Discount එක ප්‍රතිශතයක් (%) ලෙස පෙන්වීමට
      const discountPercent =
        perEpisodeAmount > 0
          ? ((discountPerEpisode / perEpisodeAmount) * 100).toFixed(1)
          : 0;

      // 2. Sub Totals සහ VAT
      const subTotalPerEpisode = perEpisodeAmount - discountPerEpisode;
      const totalValueOfSupply = subTotalPerEpisode * episodes;
      const vatAmount = totalValueOfSupply * 0.18;
      const totalWithVat = totalValueOfSupply + vatAmount;

      // 3. Advance සහ Balance Payment
      const advanceAmount = (totalValueOfSupply * advancePercent) / 100;
      const balanceAmount = totalWithVat - advanceAmount;

      // --- ප්‍රධාන ගණනය කිරීම් වගුව ---
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Total Amount - Per Episode",
            "Rs.",
            perEpisodeAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            `Less: ${discountPercent}% Discount Amount for Per Episode`,
            "Rs.",
            discountPerEpisode.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            "Sub Total Amount - Per Episode",
            "Rs.",
            subTotalPerEpisode.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            `Total Value of Supply: (${episodes} Episodes Charges)`,
            "Rs.",
            totalValueOfSupply.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            "VAT Amount (Total Value of Supply @ 18%)",
            "Rs.",
            vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          ],
          [
            "Total Amount including VAT",
            "Rs.",
            totalWithVat.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
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

      // Total Amount in Words (මුළු මුදල වචනයෙන්)
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount in Words:", 13, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(`${numberToWords(Math.floor(totalWithVat))}`, 55, finalY);

      // --- Advance Payment Section ---
      autoTable(doc, {
        startY: finalY + 5,
        body: [
          [
            {
              content: `Received ${advancePercent}% Advance Payment (Without VAT)`,
              styles: { fillColor: [230, 230, 230] },
            },
            { content: "Rs.", styles: { fillColor: [230, 230, 230] } },
            {
              content: advanceAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { halign: "right", fillColor: [230, 230, 230] },
            },
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

      // Advance Amount in words
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Amount in words:", 13, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(`${numberToWords(Math.floor(advanceAmount))}`, 40, finalY);

      // --- Balance Payment Section ---
      autoTable(doc, {
        startY: finalY + 5,
        body: [
          [
            {
              content: `Requesting Balance Payment (With VAT)`,
              styles: { fillColor: [245, 245, 245] },
            },
            { content: "Rs.", styles: { fillColor: [245, 245, 245] } },
            {
              content: balanceAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { halign: "right", fillColor: [245, 245, 245] },
            },
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

      // Balance Amount in words
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Amount in words:", 13, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(`${numberToWords(Math.floor(balanceAmount))}`, 40, finalY);

      finalY += 10;
    } else if (q.invoiceFooterType === "Type 04") {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Total Value of Supply:",
            "Rs.",
            `${q.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          ],
          // [
          //   "Discount / Sponsorship Amount",
          //   "Rs.",
          //   `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          // ],
          // [
          //   "Total Value of Supply",
          //   "Rs.",
          //   `${(q.subTotal - (q.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          // ],
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
            `${(q.subTotal * 0.18).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
            `${(q.subTotal + q.subTotal * 0.18).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        Math.floor(q.subTotal + q.subTotal * 0.18),
      );
      doc.text(`${totalInWords}`, 55, finalY);
    } else if (q.invoiceFooterType === "Non Tax with Discount") {
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
            "Grand Total Amount",
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
    } else if (q.invoiceFooterType === "Non Tax without Discount") {
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
      const totalInWords = numberToWords(Math.floor(q.subTotal));
      doc.text(`${totalInWords}`, 55, finalY);
    } else if (q.invoiceFooterType === "edit") {
      // 1. Database එකේ ඇති editExtraRows Array එක table එකට ගැලපෙන ලෙස සකස් කිරීම
      const editRowsBody = (q.editExtraRows || []).map((row) => [
        row.label, // "Total Amount", "vat valu", "include vat" වැනි labels
        "Rs.",
        Number(row.value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        }), // අගය formatting කිරීම
      ]);

      // 2. Dynamic Table එක නිර්මාණය කිරීම
      autoTable(doc, {
        startY: finalY,
        body: editRowsBody, // මෙතනට සකස් කරගත් Rows ලබා දෙනවා
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

      // 3. "Total Amount in Words" කොටස සඳහා අවසාන අගය (Last Row Value) ලබා ගැනීම
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8); // Width 195
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount in Words:", 13, finalY);
      doc.setFont("helvetica", "normal");

      // Array එකේ අවසාන අයිතමයේ value එක ගණන් වලට හැරවීම (උදා: include vat එකතුව)
      const lastRowValue =
        q.editExtraRows && q.editExtraRows.length > 0
          ? q.editExtraRows[q.editExtraRows.length - 1].value
          : 0;

      const totalInWords = numberToWords(Math.floor(lastRowValue));
      doc.text(`${totalInWords}`, 55, finalY);
    }

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

    // doc.save(`Quotation_${q.invoiceNo}.pdf`);

    if (actionType === "print") {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save("Quatation_${q.invoiceNo}.pdf");
    }
  };

  const generateSummaryPDF = (q, actionType) => {
    let calculatedGrandSubTotal = 0;
    const doc = new jsPDF();
    // const headerImg = "/image/header.jpeg";

    const drawPageBorder = () => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("IMAGINE ENTERTAINMENT (PVT) LTD", 105, 292, {
        align: "center",
      });
      doc.text("INV NO: " + q.quotationNo, 10, 292, { align: "left" });
    };

    const drawHeader = (isFirstPage) => {
      if (isFirstPage) {
        // doc.addImage(headerImg, "JPEG", 30, 10, 150, 25);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.rect(65, 10, 80, 6);
        doc.text(q.invoiceType.toUpperCase(), 105, 14.5, {
          align: "center",
        });
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

    // --- Header Boxes ---
    doc.rect(10, startY, 95, 5);
    doc.text(
      `Date of Invoice:       ${
        q.date
          ? new Date(q.date).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : ""
      }`,
      11,
      startY + 3.5,
    );
    doc.rect(10, startY + 8, 95, commonBoxHeight);
    doc.text(`Supplier's TIN:        114243400`, 11, startY + 11.5);
    doc.text(
      `Supplier's Name:     Imagine Entertainment (PVT) LTD`,
      11,
      startY + 16.5,
    );
    doc.text(`Address:                  17/18 2nd Lane,`, 11, startY + 21.5);
    doc.text(`Prathibimbarama Road,`, 41, startY + 26.5);
    doc.text(`Kalubowila,`, 41, startY + 31.5);
    doc.text(`Dehiwala.`, 41, startY + 36.5);
    doc.text(
      `Telephone No:         071 868 4008 / 071 893 3514`,
      11,
      startY + commonBoxHeight + 6.5,
    );

    doc.rect(110, startY, 95, 5);
    doc.text(
      `${q.invoiceType || "QUOTATION"} No:            ${q.quotationNo || ""}`,
      111,
      startY + 3.5,
    );
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
        143,
        startY + 21.5 + index * 5,
      );
    });

    doc.rect(10, startY + commonBoxHeight + 11.5, 95, 5);
    let deliveryDate = Array.isArray(q.eventDate)
      ? q.eventDate
          .filter((d) => d)
          .map((d) =>
            new Date(d).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
          )
          .join(", ")
      : "";
    doc.text(
      `Date Of Delivery:     ${deliveryDate}`,
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
              // සාමාන්‍ය LED Item එකක් නම් (Breakdown නැති ඒවා)
              else {
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

        finalY = doc.lastAutoTable.finalY + 3;
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
      const specialDiscount =
        Number(q.discountTotalLEDLightingSoundStageTruss) || 0;

      const totalBeforeDiscount = Number(ledSummary.categoryFinalTotal) || 0;
      const afterDiscountAmount = totalBeforeDiscount - specialDiscount;
      calculatedGrandSubTotal += afterDiscountAmount;
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
            ` ${r.discountPercent}% for ${r.rowType} `,
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
              content: specialDiscount.toLocaleString(undefined, {
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
              content: afterDiscountAmount.toLocaleString(undefined, {
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
    const hasPowerItems =
      q.powerSystems &&
      q.powerSystems.some((sub) => sub.lineItems && sub.lineItems.length > 0);

    if (hasPowerItems) {
      pSystems.forEach((cat) => renderCategoryTable(cat));

      // Summary Details වලින් නිවැරදි ID එක සොයා ගැනීම
      const powerSumData = q.summaryDetails?.find(
        (d) => d.categoryId === "power",
      );

      // දත්ත තිබේදැයි පරීක්ෂා කර වගුව ඇඳීම
      if (powerSumData && powerSumData.row && powerSumData.row.length) {
        calculatedGrandSubTotal += powerSumData.categoryFinalTotal || 0;
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
        finalY = doc.lastAutoTable.finalY + 5;
      }
    }
    // --- Power Systems Section ---
    const vSystems = [
      {
        key: "videoSystems",
        label: "Video Animation Production",
        color: [255, 204, 203],
      },
    ];
    const hasVItems =
      q.videoSystems &&
      q.videoSystems.some((sub) => sub.lineItems && sub.lineItems.length > 0);

    if (hasVItems) {
      vSystems.forEach((cat) => renderCategoryTable(cat));

      // Summary Details වලින් නිවැරදි ID එක සොයා ගැනීම
      const videoSumData = q.summaryDetails?.find(
        (d) => d.categoryId === "video",
      );

      // දත්ත තිබේදැයි පරීක්ෂා කර වගුව ඇඳීම
      if (videoSumData && videoSumData.row && videoSumData.row.length > 0) {
        calculatedGrandSubTotal += videoSumData.categoryFinalTotal || 0;
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
    }
    const TSystems = [
      {
        key: "technicianSystems",
        label: "Technician & Transport",
        color: [255, 204, 203],
      },
    ];
    const hasTechnicianItems =
      q.technicianSystems &&
      q.technicianSystems.some(
        (sub) => sub.lineItems && sub.lineItems.length > 0,
      );

    if (hasTechnicianItems) {
      TSystems.forEach((cat) => renderCategoryTable(cat));

      // Summary Details වලින් නිවැරදි ID එක සොයා ගැනීම
      const technicianSumData = q.summaryDetails?.find(
        (d) => d.categoryId === "tech",
      );

      // දත්ත තිබේදැයි පරීක්ෂා කර වගුව ඇඳීම
      if (
        technicianSumData &&
        technicianSumData.row &&
        technicianSumData.row.length > 0
      ) {
        calculatedGrandSubTotal += technicianSumData.categoryFinalTotal || 0;
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
    }
    const OSystems = [
      {
        key: "otherSystems",
        label: "other Systems",
        color: [255, 204, 203],
      },
    ];
    const hasOtherItems =
      q.otherSystems &&
      q.otherSystems.some((sub) => sub.lineItems && sub.lineItems.length > 0);

    if (hasOtherItems) {
      OSystems.forEach((cat) => renderCategoryTable(cat));

      // Summary Details වලින් නිවැරදි ID එක සොයා ගැනීම
      const otherSumData = q.summaryDetails?.find(
        (d) => d.categoryId === "other",
      );

      // දත්ත තිබේදැයි පරීක්ෂා කර වගුව ඇඳීම
      if (otherSumData && otherSumData.row && otherSumData.row.length > 0) {
        calculatedGrandSubTotal += otherSumData.categoryFinalTotal || 0;
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

    if (q.invoiceFooterType === "Proforma Invoice") {
      // Database එකෙන් අගයන් ලබා ගැනීම (නැතිනම් default අගයන් භාවිතා වේ)
      const perDayAmount = q.performanceperDayTotal || 0;
      const days = q.performancecustomDays || 1;
      const sponsorshipPerDay = q.performancecustomDiscount || 0;
      const reqPercent = q.performancerequestingAmount || 100;

      // ගණනය කිරීම්
      const sponsorshipPercent =
        perDayAmount > 0
          ? ((sponsorshipPerDay / perDayAmount) * 100).toFixed(1)
          : 0;
      const subTotalPerDay = perDayAmount - sponsorshipPerDay;
      const totalValueOfSupply = subTotalPerDay * days;
      const vatAmount = totalValueOfSupply * 0.18;
      const totalWithVat = totalValueOfSupply + vatAmount;

      // Advance Payment (Without VAT) - Total Value of Supply එකෙන් Requesting % එක
      const advancePaymentAmount = (totalValueOfSupply * reqPercent) / 100;

      // 1. ප්‍රධාන ගණන් පෙන්වන වගුව
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Total Amount - Per Day",
            "Rs.",
            perDayAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            `Less: ${sponsorshipPercent}% Sponsorship Amount for Per Day`,
            "Rs.",
            sponsorshipPerDay.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            "Sub Total Amount - Per Day",
            "Rs.",
            subTotalPerDay.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            `Total Value of Supply: (${days} Day Charges)`,
            "Rs.",
            totalValueOfSupply.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
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

      // 2. VAT වගුව
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 2,
        body: [
          [
            "VAT Amount (Total Value of Supply @ 18%)",
            "Rs.",
            vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
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

      // 3. මුළු එකතුව (Grand Total)
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 2,
        body: [
          [
            "Total Amount including VAT",
            "Rs.",
            totalWithVat.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
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

      // මුළු මුදල වචනයෙන්
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount in Words:", 13, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(`${numberToWords(Math.floor(totalWithVat))}`, 55, finalY);

      // 4. Advance Payment කොටස (Requesting Amount)
      // --- 4. Advance Payment Section (Requesting Amount) ---

      // Advance Payment වගුව
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        body: [
          [
            {
              content: `Requesting ${reqPercent}% Advance Payment (Without VAT)`,
              styles: { halign: "left" },
            },
            "Rs.",
            {
              content: advancePaymentAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { halign: "right" },
            },
          ],
        ],
        theme: "grid",
        styles: {
          fontSize: 8,
          fontStyle: "bold",
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          fillColor: [230, 230, 230], // කලින් Summary breakdown එකේ වගේ ලා අළු පැහැය
        },
        columnStyles: footerColStyles,
        margin: { left: 10 },
      });

      // Advance Payment වචනයෙන් (Amount in words)
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8); // මුළු පළලටම Border එක
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Amount in words:", 13, finalY);

      doc.setFont("helvetica", "normal");
      const advanceInWords = numberToWords(Math.floor(advancePaymentAmount));
      doc.text(`${advanceInWords}`, 40, finalY);

      finalY += 10; // ඊළඟ කොටස සඳහා ඉඩ තැබීම
    } else if (q.invoiceFooterType === "VAT All") {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Total Amount",
            "Rs.",
            `${calculatedGrandSubTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          ],
          [
            "Discount / Sponsorship Amount",
            "Rs.",
            `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          ],
          [
            "Total Value of Supply",
            "Rs.",
            `${(calculatedGrandSubTotal - (q.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
    } else if (q.invoiceFooterType === "Tax Invoice") {
      // Database එකෙන් අගයන් ලබා ගැනීම (නැතිනම් default 0)
      const perEpisodeAmount = q.taxperEpisodeTotal || 0;
      const episodes = q.taxcustomEpisodes || 1;
      const discountPerEpisode = q.taxcustomDiscount || 0;
      const advancePercent = q.taxadvancePercentage || 50;

      // --- ගණනය කිරීම් ---
      // 1. Discount Percentage (%)
      const discountPercent =
        perEpisodeAmount > 0
          ? ((discountPerEpisode / perEpisodeAmount) * 100).toFixed(1)
          : 0;

      // 2. Sub Totals
      const subTotalPerEpisode = perEpisodeAmount - discountPerEpisode;
      const totalValueOfSupply = subTotalPerEpisode * episodes;
      const vatAmount = totalValueOfSupply * 0.18;
      const totalWithVat = totalValueOfSupply + vatAmount;

      // 3. Advance & Balance
      const advanceAmount = (totalValueOfSupply * advancePercent) / 100;
      const balanceAmount = totalWithVat - advanceAmount;

      // --- PDF Table 1: ප්‍රධාන ගණනය කිරීම් ---
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Total Amount - Per Episode",
            "Rs.",
            perEpisodeAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            `Less: ${discountPercent}% Discount Amount for Per Episode`,
            "Rs.",
            discountPerEpisode.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            "Sub Total Amount - Per Episode",
            "Rs.",
            subTotalPerEpisode.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            `Total Value of Supply: (${episodes} Episodes Charges)`,
            "Rs.",
            totalValueOfSupply.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
          ],
          [
            "VAT Amount (Total Value of Supply @ 18%)",
            "Rs.",
            vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          ],
          [
            "Total Amount including VAT",
            "Rs.",
            totalWithVat.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
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

      // Total Amount in Words
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount in Words:", 13, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(`${numberToWords(Math.floor(totalWithVat))}`, 55, finalY);

      // --- PDF Table 2: Advance & Balance Section ---
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        body: [
          [
            {
              content: `Received ${advancePercent}% Advance Payment (Without VAT)`,
              styles: { fillColor: [230, 230, 230] },
            },
            { content: "Rs.", styles: { fillColor: [230, 230, 230] } },
            {
              content: advanceAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { halign: "right", fillColor: [230, 230, 230] },
            },
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

      // Advance Amount in Words
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Amount in words:", 13, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(`${numberToWords(Math.floor(advanceAmount))}`, 40, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        body: [
          [
            {
              content: `Requesting Balance Payment (With VAT)`,
              styles: { fillColor: [245, 245, 245] },
            },
            { content: "Rs.", styles: { fillColor: [245, 245, 245] } },
            {
              content: balanceAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
              styles: { halign: "right", fillColor: [245, 245, 245] },
            },
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

      // Balance Amount in Words
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8);
      doc.setFont("helvetica", "bold");
      doc.text("Amount in words:", 13, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(`${numberToWords(Math.floor(balanceAmount))}`, 40, finalY);

      finalY += 10;
    } else if (q.invoiceFooterType === "Type 04") {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Total Value of Supply",
            "Rs.",
            `${calculatedGrandSubTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          ],
          //  [
          //    "Discount / Sponsorship Amount",
          //    "Rs.",
          //    `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          //  ],
          //  [
          //    "Total Value of Supply",
          //    "Rs.",
          //    `${(calculatedGrandSubTotal - (q.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          //  ],
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
            `${(q.calculatedGrandSubTotal * 0.18).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
            `${(q.calculatedGrandSubTotal + q.calculatedGrandSubTotal * 0.18).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        Math.floor(
          q.calculatedGrandSubTotal + q.calculatedGrandSubTotal * 0.18,
        ),
      );
      doc.text(`${totalInWords}`, 55, finalY);
    } else if (q.invoiceFooterType === "Non Tax with Discount") {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Total Amount",
            "Rs.",
            `${q.calculatedGrandSubTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          ],
          [
            "Discount / Sponsorship Amount",
            "Rs.",
            `${(q.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          ],
          [
            "Grand Total Amount",
            "Rs.",
            `${(q.calculatedGrandSubTotal - (q.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
        Math.floor(q.calculatedGrandSubTotal - (q.discount || 0)),
      );
      doc.text(`${totalInWords}`, 55, finalY);
    } else if (q.invoiceFooterType === "Non Tax without Discount") {
      autoTable(doc, {
        startY: finalY,
        body: [
          [
            "Grand Total Amount",
            "Rs.",
            `${q.calculatedGrandSubTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
      const totalInWords = numberToWords(Math.floor(q.calculatedGrandSubTotal));
      doc.text(`${totalInWords}`, 55, finalY);
    } else if (q.invoiceFooterType === "edit") {
      // 1. Database එකේ ඇති editExtraRows Array එක table එකට ගැලපෙන ලෙස සකස් කිරීම
      const editRowsBody = (q.editExtraRows || []).map((row) => [
        row.label, // "Total Amount", "vat valu", "include vat" වැනි labels
        "Rs.",
        Number(row.value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        }), // අගය formatting කිරීම
      ]);

      // 2. Dynamic Table එක නිර්මාණය කිරීම
      autoTable(doc, {
        startY: finalY,
        body: editRowsBody, // මෙතනට සකස් කරගත් Rows ලබා දෙනවා
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

      // 3. "Total Amount in Words" කොටස සඳහා අවසාන අගය (Last Row Value) ලබා ගැනීම
      finalY = doc.lastAutoTable.finalY + 5;
      doc.rect(10, finalY - 5, 195, 8); // Width 195
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount in Words:", 13, finalY);
      doc.setFont("helvetica", "normal");

      // Array එකේ අවසාන අයිතමයේ value එක ගණන් වලට හැරවීම (උදා: include vat එකතුව)
      const lastRowValue =
        q.editExtraRows && q.editExtraRows.length > 0
          ? q.editExtraRows[q.editExtraRows.length - 1].value
          : 0;

      const totalInWords = numberToWords(Math.floor(lastRowValue));
      doc.text(`${totalInWords}`, 55, finalY);
    }

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

      // --- drawPageBorder ශ්‍රිතයේ ඇති දේවල් මෙතනට කෙලින්ම ලබා දෙන්න ---
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);

      // Footer Text
      doc.text("IMAGINE ENTERTAINMENT (PVT) LTD", 105, 292, {
        align: "center",
      });
      doc.text("QT NO: " + q.quotationNo, 10, 292, { align: "left" });

      // පිටු අංකය
      doc.text(`${i} / ${totalPages}`, 195, 292, { align: "right" });
    }

    if (actionType === "print") {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save("Quotation_${q.invoiceNo}.pdf");
    }
    // doc.save(`Quotation_Summary_${q.invoiceNo}.pdf`);
  };

  return (
    <div className="dashboard-container" style={{ padding: "20px" }}>
      <h2>Generated Invoices</h2>
      <table className="db-table" style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Invoice NO</th>
            <th>Client Name</th>
            <th>Company</th>
            <th>Grand Total</th>
            <th>Invoice Type</th>
            <th>Invoice Footer Type</th>
            <th>Download</th>
            <th>Print</th>
          </tr>
        </thead>
        <tbody>
          {allInvoices.length > 0 ? (
            allInvoices.map((inv, index) => (
              <tr key={index}>
                <td>{inv.date}</td>
                <td>{inv.invoiceNo}</td>
                <td>{inv.ClientName}</td>
                <td>{inv.companyName}</td>
                <td>Rs. {inv.grandTotal?.toLocaleString()}</td>
                <td>
                  <select
                    value={inv.invoiceType || "Tax Invoice"}
                    onChange={(e) =>
                      handleStatusChange(inv._id, "invoiceType", e.target.value)
                    }
                    style={{
                      padding: "5px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Proforma Invoice">Proforma Invoice</option>
                    <option value="Normal Invoice">Normal Invoice</option>
                    <option value="Commercial Invoice">
                      Commercial Invoice
                    </option>
                  </select>
                </td>
                <td>
                  <select
                    value={inv.invoiceFooterType || "VAT All"}
                    onChange={(e) =>
                      handleStatusChange(
                        inv._id,
                        "invoiceFooterType",
                        e.target.value,
                      )
                    }
                    style={{
                      padding: "5px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    <option value="Proforma Invoice"> Proforma Invoice</option>
                    <option value="VAT All">VAT All</option>
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Type 04">Type 04</option>
                    <option value="Non Tax with Discount">
                      Non Tax with Discount
                    </option>
                    <option value="Non Tax without Discount">
                      Non Tax without Discount
                    </option>
                  </select>
                </td>
                <td>
                  <button
                    className="btn-download"
                    onClick={() => generatePDF(inv, "download")} // 🟢 q වෙනුවට inv භාවිතා කරන්න
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
                No Invoices Generated Yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
