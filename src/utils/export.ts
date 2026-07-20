import ExcelJS from "exceljs";
import { Response } from "express";

export async function exportToXlsx(
  res: Response,
  rows: any[],
  columns: { header: string; key: string }[],
  filename: string
) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Data");
  sheet.columns = columns;
  sheet.addRows(rows);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
}
