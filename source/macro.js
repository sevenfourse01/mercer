/* macro.js (Mercer 12, owner (f) results; fix 3 owner: atlas): the weather. Every row below is
   notes/macro.json, verbatim: value, unit, period, asOf, source, url, note and sector as read on
   19 September 2026 (notes/facts-macro.md holds the sentences they were read from). Nothing here
   feeds the engine; the Reach card and the exports print these rows with their source and date, and
   M.macro.weatherLines() writes the rule lines COPY §11 allows: at most two, and the card face shows
   the first. A row whose unit says "projection" is printed with that word. Every figure in a rule
   line is a row's value, never a number that only a note holds, and the line names the ids it read. */
(() => {
"use strict";
const M = (window.Mercer = window.Mercer || {});
const rows = [
    {
      "id": "boe_bank_rate",
      "label": "Bank Rate",
      "value": 3.75,
      "unit": "%",
      "period": "MPC meeting ending 16 Sep 2026",
      "asOf": "2026-09-17",
      "source": "Bank of England, Monetary Policy Summary and minutes, September 2026",
      "url": "https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes/2026/september-2026",
      "note": "Held, vote 6-3; three members voted for +0.25pp to 4%. Sixth consecutive hold since the cut to 3.75% in Dec 2025. Next decision 5 Nov 2026."
    },
    {
      "id": "boe_cpi_projection_q4_2026",
      "label": "BoE projection: CPI inflation, 2026 Q4",
      "value": 3.75,
      "unit": "% (projection)",
      "period": "2026 Q4",
      "asOf": "2026-09-17",
      "source": "Bank of England, Monetary Policy Summary, September 2026",
      "url": "https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes/2026/september-2026",
      "note": "Verbatim: 'CPI inflation was expected to increase to around 3¾% in 2026 Q4'. A projection, not an outturn."
    },
    {
      "id": "boe_gdp_projection_q3_2026",
      "label": "BoE staff projection: GDP growth, 2026 Q3",
      "value": 0.4,
      "unit": "% q/q (projection)",
      "period": "2026 Q3",
      "asOf": "2026-09-17",
      "source": "Bank of England, Monetary Policy Summary, September 2026",
      "url": "https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes/2026/september-2026",
      "note": "A projection, not an outturn."
    },
    {
      "id": "cpi_annual",
      "label": "CPI inflation, 12-month rate",
      "value": 3.1,
      "unit": "%",
      "period": "August 2026",
      "asOf": "2026-09-16",
      "source": "ONS, Consumer price inflation, UK: August 2026",
      "url": "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/august2026",
      "note": "Up from 2.9% in July 2026. Monthly CPI +0.5%. Transport, mainly motor fuels, was the largest upward contribution. Next release 21 Oct 2026."
    },
    {
      "id": "cpih_annual",
      "label": "CPIH inflation, 12-month rate",
      "value": 3.3,
      "unit": "%",
      "period": "August 2026",
      "asOf": "2026-09-16",
      "source": "ONS, Consumer price inflation, UK: August 2026",
      "url": "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/august2026"
    },
    {
      "id": "cpi_core_annual",
      "label": "Core CPI (excl. energy, food, alcohol, tobacco), 12-month rate",
      "value": 2.6,
      "unit": "%",
      "period": "August 2026",
      "asOf": "2026-09-16",
      "source": "ONS, Consumer price inflation, UK: August 2026",
      "url": "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/august2026",
      "note": "Unchanged from July 2026."
    },
    {
      "id": "gdp_qoq",
      "label": "GDP growth, quarter on quarter",
      "value": 0.4,
      "unit": "%",
      "period": "Q2 2026 (Apr to Jun) vs Q1 2026",
      "asOf": "2026-08-13",
      "source": "ONS, GDP first quarterly estimate, UK: April to June 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpfirstquarterlyestimateuk/apriltojune2026",
      "note": "First estimate; Q1 2026 was +0.6%. Services +0.5%, construction +0.3%, production 0.0%. Quarterly national accounts (revision) due 30 Sep 2026."
    },
    {
      "id": "gdp_yoy",
      "label": "GDP growth, same quarter a year ago",
      "value": 1.2,
      "unit": "%",
      "period": "Q2 2026 vs Q2 2025",
      "asOf": "2026-08-13",
      "source": "ONS, GDP first quarterly estimate, UK: April to June 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpfirstquarterlyestimateuk/apriltojune2026",
      "note": "Verbatim: 'GDP is estimated to be 1.2% higher in Quarter 2 2026, compared with the same quarter a year ago.' GDP per head +1.0% y/y."
    },
    {
      "id": "gdp_monthly",
      "label": "GDP growth, month on month",
      "value": 0.4,
      "unit": "%",
      "period": "July 2026 vs June 2026",
      "asOf": "2026-09-11",
      "source": "ONS, GDP monthly estimate, UK: July 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpmonthlyestimateuk/july2026",
      "note": "June +0.3%, May 0.0%. Three months to July +0.4%. Services +0.4%, production +0.2%, construction +0.1% in the month. Next release 15 Oct 2026."
    },
    {
      "id": "unemployment_rate",
      "label": "Unemployment rate, aged 16 and over",
      "value": 4.9,
      "unit": "%",
      "period": "May to July 2026",
      "asOf": "2026-09-15",
      "source": "ONS, Labour market overview, UK: September 2026",
      "url": "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/september2026",
      "note": "Up 0.2pp on the year, largely unchanged on the quarter. LFS-based."
    },
    {
      "id": "employment_rate",
      "label": "Employment rate, aged 16 to 64",
      "value": 75.1,
      "unit": "%",
      "period": "May to July 2026",
      "asOf": "2026-09-15",
      "source": "ONS, Labour market overview, UK: September 2026",
      "url": "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/september2026"
    },
    {
      "id": "vacancies",
      "label": "Vacancies",
      "value": 702000,
      "unit": "vacancies",
      "period": "June to August 2026",
      "asOf": "2026-09-15",
      "source": "ONS, Labour market overview, UK: September 2026",
      "url": "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/september2026",
      "note": "Down 8,000 (1.1%) on March to May 2026; lowest since 2014 outside the pandemic period."
    },
    {
      "id": "regular_pay_growth",
      "label": "Regular pay growth (excluding bonuses), annual",
      "value": 3.5,
      "unit": "% y/y",
      "period": "May to July 2026",
      "asOf": "2026-09-15",
      "source": "ONS, Labour market overview, UK: September 2026",
      "url": "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/september2026",
      "note": "Total pay including bonuses +3.9%."
    },
    {
      "id": "payrolled_employees_change",
      "label": "Payrolled employees, annual change",
      "value": -101000,
      "unit": "employees",
      "period": "July 2025 to July 2026",
      "asOf": "2026-09-15",
      "source": "ONS, Labour market overview, UK: September 2026",
      "url": "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/uklabourmarket/september2026",
      "note": "A fall of 0.3%. Down 19,000 (0.1%) between June and July 2026."
    },
    {
      "id": "bics_trading",
      "label": "BICS: businesses currently trading",
      "value": 95,
      "unit": "% of businesses",
      "period": "17 to 30 August 2026 (Wave 163)",
      "asOf": "2026-09-03",
      "source": "ONS, Business insights and impact on the UK economy: 3 September 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/business/businessservices/bulletins/businessinsightsandimpactontheukeconomy/3september2026",
      "note": "85% fully trading, 10% partially trading. This release has no turnover or price expectations headline and no industry split."
    },
    {
      "id": "bics_energy_price_concern",
      "label": "BICS: businesses with some concern about energy prices",
      "value": 59,
      "unit": "% of businesses",
      "period": "late August 2026 (Wave 163)",
      "asOf": "2026-09-03",
      "source": "ONS, Business insights and impact on the UK economy: 3 September 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/business/businessservices/bulletins/businessinsightsandimpactontheukeconomy/3september2026",
      "note": "63% reported some concern about fuel price increases."
    },
    {
      "id": "bics_supply_chain_conflict_concern",
      "label": "BICS: businesses (10+ employees) concerned about international conflict affecting supply chains",
      "value": 28,
      "unit": "% of businesses with 10 or more employees",
      "period": "August 2026 (Wave 163)",
      "asOf": "2026-09-03",
      "source": "ONS, Business insights and impact on the UK economy: 3 September 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/business/businessservices/bulletins/businessinsightsandimpactontheukeconomy/3september2026",
      "note": "21% concerned about shipping disruption; of those concerned, 53% expected material costs to rise and 46% transport costs."
    },
    {
      "id": "bics_staffing_costs_up",
      "label": "BICS: businesses reporting staffing costs rose over the last three months",
      "value": 38,
      "unit": "% of businesses",
      "period": "August 2026 (Wave 163)",
      "asOf": "2026-09-03",
      "source": "ONS, Business insights and impact on the UK economy: 3 September 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/business/businessservices/bulletins/businessinsightsandimpactontheukeconomy/3september2026"
    },
    {
      "id": "boe_agents_headline",
      "label": "BoE Agents: overall business conditions",
      "value": "Output and business confidence has improved in some sectors. But there remain significant pockets of weakness with little expectation of imminent improvement.",
      "unit": "quote",
      "period": "six weeks to mid-August 2026",
      "asOf": "2026-09-11",
      "source": "Bank of England, Agents' summary of business conditions, September 2026",
      "url": "https://www.bankofengland.co.uk/agents-summary/2026/september-2026",
      "note": "Employment intentions broadly flat; recruitment difficulties below normal; input costs and consumer prices continue to edge up."
    },
    {
      "id": "boe_agents_pay_settlements_2026",
      "label": "BoE Agents: average 2026 pay settlement",
      "value": 3.6,
      "unit": "%",
      "period": "settlements reported for 2026, to mid-August 2026",
      "asOf": "2026-09-11",
      "source": "Bank of England, Agents' summary of business conditions, September 2026",
      "url": "https://www.bankofengland.co.uk/agents-summary/2026/september-2026",
      "note": "Verbatim: 'Pay settlements reported so far for 2026 average around 3.6%.'"
    },
    {
      "id": "sector_profserv_ons_output_3m",
      "label": "Professional, scientific and technical activities output, three-month growth",
      "value": 2.1,
      "unit": "% (3 months to Jul 2026 vs 3 months to Apr 2026)",
      "period": "three months to July 2026",
      "asOf": "2026-09-11",
      "source": "ONS, GDP monthly estimate, UK: July 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpmonthlyestimateuk/july2026",
      "sector": "professional services",
      "note": "Scientific R&D +7.0%, legal activities +3.1%, advertising and market research +3.4%."
    },
    {
      "id": "sector_profserv_boe_agents",
      "label": "BoE Agents: business and professional services",
      "value": "Contacts report growing revenues due to continued fee increases and some robust pockets of growth. Sectors growing robustly include IT, tax, employment law, restructuring, and engineering consultancy. Overall growth in 2026 H2 is expected to remain modest and uneven, and often fee led rather than volume driven.",
      "unit": "quote",
      "period": "six weeks to mid-August 2026",
      "asOf": "2026-09-11",
      "source": "Bank of England, Agents' summary of business conditions, September 2026",
      "url": "https://www.bankofengland.co.uk/agents-summary/2026/september-2026",
      "sector": "professional services"
    },
    {
      "id": "sector_healthcare_phin_q1_2026_admissions",
      "label": "Private healthcare admissions (inpatient and day-case), UK",
      "value": 247495,
      "unit": "admissions",
      "period": "Q1 2026 (Jan to Mar)",
      "asOf": "2026-09-08",
      "source": "PHIN, Private healthcare market update: September 2026, United Kingdom",
      "url": "https://www.phin.org.uk/news/private-market-update-sept-2026-uk",
      "sector": "private healthcare",
      "note": "Up less than 1% on Q1 2025 (246,550). Insured admissions down 2.6% (4,530 fewer)."
    },
    {
      "id": "sector_healthcare_phin_selfpay_growth",
      "label": "Private healthcare self-pay admissions, annual growth",
      "value": 7.7,
      "unit": "% y/y",
      "period": "Q1 2026 vs Q1 2025",
      "asOf": "2026-09-08",
      "source": "PHIN, Private healthcare market update: September 2026, United Kingdom",
      "url": "https://www.phin.org.uk/news/private-market-update-sept-2026-uk",
      "sector": "private healthcare",
      "note": "Verbatim: 'UK self-pay admissions increased by 7.7% in Q1 2026 compared to Q1 2025.'"
    },
    {
      "id": "sector_healthcare_phin_selfpay_share",
      "label": "Private healthcare admissions funded by self-pay",
      "value": 31,
      "unit": "% of admissions",
      "period": "Q1 2026",
      "asOf": "2026-09-08",
      "source": "PHIN press release, 8 September 2026",
      "url": "https://www.phin.org.uk/press-releases/older-patients-opting-to-pay-direct-for-private-cataract-surgery",
      "sector": "private healthcare",
      "note": "Highest share since Q3 2023; 69% insured. 2025 full year was 70:30 insured to self-pay on 953,000 admissions (PHIN June 2026 update)."
    },
    {
      "id": "sector_healthcare_phin_2025_admissions",
      "label": "Private healthcare admissions, UK, calendar 2025",
      "value": 953000,
      "unit": "admissions",
      "period": "2025",
      "asOf": "2026-06-02",
      "source": "PHIN, Private healthcare market update: June 2026, United Kingdom",
      "url": "https://www.phin.org.uk/news/private-market-update-june-2026-uk",
      "sector": "private healthcare",
      "note": "1% above 2024. Self-pay admissions up 0.2% (565) on 2024."
    },
    {
      "id": "sector_healthcare_ons_output_monthly",
      "label": "Human health activities output, month on month",
      "value": 0.6,
      "unit": "%",
      "period": "July 2026 vs June 2026",
      "asOf": "2026-09-11",
      "source": "ONS, GDP monthly estimate, UK: July 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpmonthlyestimateuk/july2026",
      "sector": "private healthcare",
      "note": "Covers public and private health activities together."
    },
    {
      "id": "sector_hospitality_ons_food_beverage_3m",
      "label": "Food and beverage service activities output, three-month growth",
      "value": -1.4,
      "unit": "% (3 months to Jul 2026 vs 3 months to Apr 2026)",
      "period": "three months to July 2026",
      "asOf": "2026-09-11",
      "source": "ONS, GDP monthly estimate, UK: July 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpmonthlyestimateuk/july2026",
      "sector": "hospitality"
    },
    {
      "id": "sector_hospitality_ons_accommodation_3m",
      "label": "Accommodation output, three-month growth",
      "value": 3.2,
      "unit": "% (3 months to Jul 2026 vs 3 months to Apr 2026)",
      "period": "three months to July 2026",
      "asOf": "2026-09-11",
      "source": "ONS, GDP monthly estimate, UK: July 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpmonthlyestimateuk/july2026",
      "sector": "hospitality",
      "note": "Accommodation grew 2.6% in the month of July 2026."
    },
    {
      "id": "sector_hospitality_ukh_optimism",
      "label": "Hospitality venues optimistic after the business-rates announcement",
      "value": 37,
      "unit": "% of respondents",
      "period": "fieldwork July 2026",
      "asOf": "2026-08-27",
      "source": "UKHospitality, BBPA, BII and Hospitality Ulster member survey, run by CGA by NIQ",
      "url": "https://www.ukhospitality.org.uk/hospitality-confidence-sees-burnham-bounce/",
      "sector": "hospitality",
      "note": "18% were optimistic before the Prime Minister's announcement on reducing business rates. 76% cite the tax burden as a barrier to investment, 37% political instability. Respondents operate more than 20,000 sites."
    },
    {
      "id": "sector_hospitality_boe_agents",
      "label": "BoE Agents: hospitality",
      "value": "Hospitality firms generally report challenging trading conditions.",
      "unit": "quote",
      "period": "six weeks to mid-August 2026",
      "asOf": "2026-09-11",
      "source": "Bank of England, Agents' summary of business conditions, September 2026",
      "url": "https://www.bankofengland.co.uk/agents-summary/2026/september-2026",
      "sector": "hospitality",
      "note": "Little sign of a 'staycation' effect from the Middle East conflict; hotel and leisure spend varies by location."
    },
    {
      "id": "sector_construction_ons_output_monthly",
      "label": "Construction output, month on month",
      "value": 0.1,
      "unit": "%",
      "period": "July 2026 vs June 2026",
      "asOf": "2026-09-11",
      "source": "ONS, Construction output in Great Britain: July 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/constructionindustry/bulletins/constructionoutputingreatbritain/july2026",
      "sector": "construction and home services",
      "note": "Repair and maintenance +0.8%, new work -0.4% in the month."
    },
    {
      "id": "sector_construction_ons_rm_monthly",
      "label": "Construction repair and maintenance output, month on month",
      "value": 0.8,
      "unit": "%",
      "period": "July 2026 vs June 2026",
      "asOf": "2026-09-11",
      "source": "ONS, Construction output in Great Britain: July 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/constructionindustry/bulletins/constructionoutputingreatbritain/july2026",
      "sector": "construction and home services"
    },
    {
      "id": "sector_construction_ons_rm_3m",
      "label": "Construction repair and maintenance output, three-month growth",
      "value": -0.7,
      "unit": "% (3 months to Jul 2026 vs 3 months to Apr 2026)",
      "period": "three months to July 2026",
      "asOf": "2026-09-11",
      "source": "ONS, Construction output in Great Britain: July 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/constructionindustry/bulletins/constructionoutputingreatbritain/july2026",
      "sector": "construction and home services",
      "note": "From the same sentence of the bulletin as total output (-0.5%) and new work (-0.4%) over the three months."
    },
    {
      "id": "sector_construction_ons_private_housing_rm_monthly",
      "label": "Private housing repair and maintenance output, month on month",
      "value": 1.7,
      "unit": "%",
      "period": "July 2026 vs June 2026",
      "asOf": "2026-09-11",
      "source": "ONS, Construction output in Great Britain: July 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/constructionindustry/bulletins/constructionoutputingreatbritain/july2026",
      "sector": "construction and home services",
      "note": "Over the three months to July 2026 the same series fell 1.7%."
    },
    {
      "id": "sector_construction_ons_output_3m",
      "label": "Construction output, three-month growth",
      "value": -0.5,
      "unit": "% (3 months to Jul 2026 vs 3 months to Apr 2026)",
      "period": "three months to July 2026",
      "asOf": "2026-09-11",
      "source": "ONS, Construction output in Great Britain: July 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/constructionindustry/bulletins/constructionoutputingreatbritain/july2026",
      "sector": "construction and home services",
      "note": "New work -0.4%, repair and maintenance -0.7% over the three months."
    },
    {
      "id": "sector_construction_boe_agents",
      "label": "BoE Agents: construction",
      "value": "Construction remains weak, especially housebuilding. Private housebuilding activity continues to be particularly weak, especially in London.",
      "unit": "quote",
      "period": "six weeks to mid-August 2026",
      "asOf": "2026-09-11",
      "source": "Bank of England, Agents' summary of business conditions, September 2026",
      "url": "https://www.bankofengland.co.uk/agents-summary/2026/september-2026",
      "sector": "construction and home services"
    },
    {
      "id": "sector_retail_ons_volumes_monthly",
      "label": "Retail sales volumes, month on month, Great Britain",
      "value": 0.5,
      "unit": "%",
      "period": "August 2026 vs July 2026",
      "asOf": "2026-09-18",
      "source": "ONS, Retail sales, Great Britain: August 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/retailindustry/bulletins/retailsales/august2026",
      "sector": "retail and e-commerce",
      "note": "Three months to August +0.9% on the three months to May."
    },
    {
      "id": "sector_retail_ons_volumes_yoy",
      "label": "Retail sales volumes, annual growth, Great Britain",
      "value": 2.4,
      "unit": "% y/y",
      "period": "August 2026 vs August 2025",
      "asOf": "2026-09-18",
      "source": "ONS, Retail sales, Great Britain: August 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/retailindustry/bulletins/retailsales/august2026",
      "sector": "retail and e-commerce"
    },
    {
      "id": "sector_retail_ons_online_share",
      "label": "Proportion of retail sales made online, Great Britain",
      "value": 28.8,
      "unit": "% of retail sales",
      "period": "August 2026",
      "asOf": "2026-09-18",
      "source": "ONS, Retail sales, Great Britain: August 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/retailindustry/bulletins/retailsales/august2026",
      "sector": "retail and e-commerce",
      "note": "Up from 28.4% in July 2026."
    },
    {
      "id": "sector_retail_ons_online_values_yoy",
      "label": "Online retail sales values, annual growth, Great Britain",
      "value": 8.9,
      "unit": "% y/y",
      "period": "August 2026 vs August 2025",
      "asOf": "2026-09-18",
      "source": "ONS, Retail sales, Great Britain: August 2026",
      "url": "https://www.ons.gov.uk/businessindustryandtrade/retailindustry/bulletins/retailsales/august2026",
      "sector": "retail and e-commerce",
      "note": "Online sales values +2.5% in the month, after -4.2% in July."
    },
    {
      "id": "sector_retail_boe_agents",
      "label": "BoE Agents: consumer spending and retail",
      "value": "Consumer spending growth remains moderate and mainly price driven. Supermarkets continue to report weak food sales volumes.",
      "unit": "quote",
      "period": "six weeks to mid-August 2026",
      "asOf": "2026-09-11",
      "source": "Bank of England, Agents' summary of business conditions, September 2026",
      "url": "https://www.bankofengland.co.uk/agents-summary/2026/september-2026",
      "sector": "retail and e-commerce"
    },
    {
      "id": "sector_software_ons_computer_programming_monthly",
      "label": "Computer programming, consultancy and related activities output, month on month",
      "value": 3.5,
      "unit": "%",
      "period": "July 2026 vs June 2026",
      "asOf": "2026-09-11",
      "source": "ONS, GDP monthly estimate, UK: July 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpmonthlyestimateuk/july2026",
      "sector": "software",
      "note": "Contributed 0.14pp to services output and 0.12pp to GDP in July 2026; the largest single contributor to July's GDP growth."
    },
    {
      "id": "sector_software_ons_infocomm_monthly",
      "label": "Information and communication output, month on month",
      "value": 2.4,
      "unit": "%",
      "period": "July 2026 vs June 2026",
      "asOf": "2026-09-11",
      "source": "ONS, GDP monthly estimate, UK: July 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpmonthlyestimateuk/july2026",
      "sector": "software"
    },
    {
      "id": "sector_software_ons_computer_programming_3m",
      "label": "Computer programming, consultancy and related activities output, three-month growth",
      "value": 4.4,
      "unit": "% (3 months to Jul 2026 vs 3 months to Apr 2026)",
      "period": "three months to July 2026",
      "asOf": "2026-09-11",
      "source": "ONS, GDP monthly estimate, UK: July 2026",
      "url": "https://www.ons.gov.uk/economy/grossdomesticproductgdp/bulletins/gdpmonthlyestimateuk/july2026",
      "sector": "software",
      "note": "Information and communication as a whole +2.5% over the same three months."
    },
    {
      "id": "sector_software_boe_agents",
      "label": "BoE Agents: technology spend",
      "value": "Business services firms are increasing their technology spend – including on AI.",
      "unit": "quote",
      "period": "six weeks to mid-August 2026",
      "asOf": "2026-09-11",
      "source": "Bank of England, Agents' summary of business conditions, September 2026",
      "url": "https://www.bankofengland.co.uk/agents-summary/2026/september-2026",
      "sector": "software"
    },
    {
      "id": "sector_software_techuk_conditions_challenging",
      "label": "Tech firms describing UK conditions as challenging for expansion",
      "value": 56,
      "unit": "% of tech businesses surveyed",
      "period": "fieldwork 24 Feb to 6 Mar 2026",
      "asOf": "2026-03-16",
      "source": "techUK and Public First, The state of UK tech in 2026 (500 business leaders, 275 in tech)",
      "url": "https://www.techuk.org/resource/the-state-of-uk-tech-in-2026-polling-from-techuk-public-first.html",
      "sector": "software",
      "note": "83% of tech firms exploring international expansion; 45% have considered relocating investment or operations outside the UK. Older than the other signals; sentiment context only."
    }
  ];

const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

/* the sector rows per contentKey (SPEC §10); finance, property, creative and public get the headline rows only */
const HEADLINE = ["boe_bank_rate", "cpi_annual", "gdp_qoq"];
/* the Bank's two projections, the only sourced rows about the months ahead: printed after the headline rows, and
   isProjection() gives each the word "projection" wherever a row is printed (fix 3, C17e) */
const PROJECTIONS = ["boe_cpi_projection_q4_2026", "boe_gdp_projection_q3_2026"];
/* home-services shows repair and maintenance over the month and over the three months, side by side: the month alone
   was the one good figure in a bulletin that fell (fix 3, C40.1). Every id a rule line reads is a row shown here */
const SECTOR_ROWS = {
  "professional-services": ["sector_profserv_ons_output_3m", "sector_profserv_boe_agents"],
  "private-healthcare": ["sector_healthcare_phin_selfpay_share", "sector_healthcare_phin_selfpay_growth", "sector_healthcare_phin_q1_2026_admissions"],
  hospitality: ["sector_hospitality_ons_food_beverage_3m", "sector_hospitality_ons_accommodation_3m", "sector_hospitality_ukh_optimism"],
  "home-services": ["sector_construction_ons_rm_monthly", "sector_construction_ons_rm_3m", "sector_construction_boe_agents"],
  "e-commerce": ["sector_retail_ons_online_share", "sector_retail_ons_online_values_yoy", "sector_retail_ons_volumes_yoy"],
  "b2b-saas": ["sector_software_ons_computer_programming_monthly", "sector_software_boe_agents", "sector_software_techuk_conditions_challenging"],
};
/* the sector ids each set of rows is about (SPEC §10). contentKey is shared more widely than this (sectors.js CONTENT):
   leisure reads hospitality's advice, but gyms and golf clubs are not in the ONS food and accommodation series, so leisure
   gets no rows. The test is the sector id, never M.fitted: hospitality has no engine niche and still has its rows (fix 3,
   C17a, C40.2) */
const ROW_SECTORS = {
  "professional-services": ["professional"],
  "private-healthcare": ["health"],
  hospitality: ["hospitality"],
  "home-services": ["construction", "home"],
  "e-commerce": ["retail"],
  "b2b-saas": ["tech"],
};
const hasSeries = (contentKey, sector) => (ROW_SECTORS[contentKey ?? ""] ?? []).includes(sector) && (SECTOR_ROWS[contentKey ?? ""] ?? []).length > 0;
const forKey = (contentKey) => {
  const sector = M.state?.sector;
  if (sector && !(ROW_SECTORS[contentKey ?? ""] ?? []).includes(sector)) return [];
  return (SECTOR_ROWS[contentKey] ?? []).map((id) => byId[id]).filter(Boolean);
};
/** the rows every visitor sees: the three headline rows, the two projections, then any row the visitor's own rule lines
    read that is not already on the card, so a line never quotes a figure the card does not show */
const headline = () => {
  const ids = [...HEADLINE, ...PROJECTIONS];
  try {
    const key = typeof M.contentKey === "function" ? M.contentKey() : null;
    const shown = new Set([...ids, ...forKey(key).map((r) => r.id)]);
    weatherLines(M.state).forEach((l) => l.ids.forEach((id) => { if (!shown.has(id)) { shown.add(id); ids.push(id); } }));
  } catch (e) { /* the fixed rows stand */ }
  return ids.map((id) => byId[id]).filter(Boolean);
};

const isProjection = (r) => /projection/i.test(String(r?.unit ?? ""));
/** a row's asOf as a UK reader writes a date: "16 September 2026". UTC, so the day never slips with the time zone (fix 3, C29.5) */
const ukDate = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(+d) ? String(iso ?? "") : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};
/** the short word for where a row was read: "ONS", "Bank of England", "PHIN" */
const sourceWord = (r) => String(r?.source ?? "").split(",")[0].replace(/\s+press release$/i, "").trim();
/** one row as COPY §11 prints it: "{label}: {value}{unit}, {period} ({source}, as of {asOf})"; a quote row in quotation
    marks. A projection's unit drops its "(projection)" here because every printer adds the word from isProjection(), and
    a period the label already ends with is not said twice. `opts.iso` keeps the date as macro.json holds it */
function rowLine(r, opts) {
  if (!r) return "";
  const when = opts?.iso ? r.asOf : ukDate(r.asOf);
  if (r.unit === "quote") return `"${r.value}" (${r.source}, as of ${when})`;
  const unit = String(r.unit ?? "").replace(/\s*\(projection\)/i, "");
  const shown = unit.startsWith("%") ? `${r.value}${unit}` : `${Number(r.value).toLocaleString("en-GB")} ${unit}`;
  const period = r.period && !String(r.label ?? "").endsWith(String(r.period)) ? `, ${r.period}` : "";
  return `${r.label}: ${shown}${period} (${r.source}, as of ${when})`;
}

/** one sentence with the source word and the newest as-of date among the rows it read (fix 3, C17f). weatherLines and
    contextFor both build their lines here, so a sourced sentence is written one way everywhere */
function sourcedLine(kind, sentence, ids) {
  const iso = ids.map((id) => byId[id]?.asOf).filter(Boolean).sort().pop() ?? null;
  const source = [...new Set(ids.map((id) => sourceWord(byId[id])).filter(Boolean))].join(" and ");
  const date = iso ? ukDate(iso) : null;
  return { kind, text: source && date ? `${sentence} ${source}, as of ${date}.` : sentence, sentence, ids, source, date, asOfIso: iso, asOf: null };
}

/* the health kinds PHIN does not count: it measures admissions to private hospitals (fix 3, C40.3) */
const NOT_PHIN = ["Veterinary", "Optician", "Pharmacy", "Care at home", "Care home"];
/** the rule lines for one visitor (COPY §11): at most two, the first headline tie that applies and the first sector tie
    that applies, in that order, so [0] is the line the card face shows (fix 3, C17c). A headline tie reads one of the
    visitor's own answers against a headline row; a sector tie reads their sector's series. Where neither of those
    applies, a second set of headline ties reads an answer against a row macro.js already holds, so a sector with no
    series still gets a sourced line (C17d). Each line names the ids it read, and its `text` ends with the source word
    and the newest as-of date among them (C17f), so every printer shows both; `sentence` is the same line without them.
    `asOf` stays null so a printer that adds its own "as of" does not say the date twice; the date is in `date` (UK form)
    and `asOfIso`. "Mercer holds no sector series" is never a rule line: it lives in the foot, under the ▾ (C17d). */
function weatherLines(state) {
  const s = state ?? M.state ?? {};
  const v = (id) => byId[id]?.value;
  const has = (...ids) => ids.every((id) => byId[id] && byId[id].value !== undefined && byId[id].value !== null);
  const key = typeof M.contentKey === "function" ? M.contentKey() : null;
  const sector = s.sector;
  /* an answer marked Not sure or N/A is not an answer */
  const set = (id) => { try { return !(s.notSure?.has?.(id) || s.na?.has?.(id)); } catch (e) { return true; } };
  const moved = (x) => `${Number(x) < 0 ? "fell" : "rose"} ${Math.abs(Number(x))}%`;
  const first = (period) => String(period ?? "").split(" vs ")[0];
  const line = sourcedLine;
  const planned = M.planned;
  /* the Return rank of the price step. The cards' own ranking (M.canopy.steps) is read first, so the line can never name
     a rank the cards do not show; without it, the same sum here: steps under 2% of the added middle run are not steps */
  const priceLever = () => {
    const isPrice = /deal value|price/i;
    try {
      const ranked = M.canopy?.steps?.();
      if (Array.isArray(ranked)) return ranked.find((st) => isPrice.test(String(st.lever ?? "")))?.rank ?? null;
    } catch (e) { /* the local ranking below */ }
    const floor = Math.max(1, 0.02 * Math.abs(planned?.added?.p50 ?? 0));
    const all = (planned?.levers ?? []).filter((l) => l.direction === "up" && Math.abs(l.magnitude) >= floor).map((l) => ({ l, r: Math.abs(l.magnitude) / ({ low: 1, medium: 2, high: 3 }[l.difficulty] ?? 2) })).sort((a, b) => b.r - a.r);
    const at = all.findIndex((x) => isPrice.test(String(x.l.lever ?? "")));
    return at < 0 ? null : at + 1;
  };
  const raised = set("priceRaised") ? s.priceRaised : null;
  const cpiAhead = () => `CPI is ${v("cpi_annual")}% and the Bank projects about ${v("boe_cpi_projection_q4_2026")}% by ${byId.boe_cpi_projection_q4_2026.period} (a projection).`;

  /* the headline ties COPY §11 has always had. "Over three years ago" is said only to the visitor who said it; Never
     gets its own sentence (fix 3, C35.2) */
  let head = null;
  if (raised === "long" && has("cpi_annual", "boe_cpi_projection_q4_2026")) head = line("headline", `Your last price rise was over three years ago; ${cpiAhead()}`, ["cpi_annual", "boe_cpi_projection_q4_2026"]);
  else if (raised === "never" && has("cpi_annual", "boe_cpi_projection_q4_2026")) head = line("headline", `You have not raised prices; ${cpiAhead()}`, ["cpi_annual", "boe_cpi_projection_q4_2026"]);
  else if (set("terms") && s.terms === "sixty" && has("boe_bank_rate")) head = line("headline", `Customers pay at 60 days while Bank Rate sits at ${v("boe_bank_rate")}%: the wait has a cost.`, ["boe_bank_rate"]);
  else if (Array.isArray(s.funding) && s.funding.includes("loan") && has("boe_bank_rate")) head = line("headline", `Bank Rate is ${v("boe_bank_rate")}%, held at the ${byId.boe_bank_rate.period}.`, ["boe_bank_rate"]);

  /* the sector ties: each checks the sector id as well as the contentKey, and only the kinds its series measures */
  let sect = null;
  if (key === "professional-services" && sector === "professional" && has("sector_profserv_boe_agents") && priceLever()) {
    sect = line("sector", `The Bank’s Agents describe fee-led growth in your sector; your Return rank ${priceLever()} step is a price rise.`, ["sector_profserv_boe_agents"]);
  } else if (key === "private-healthcare" && sector === "health" && !NOT_PHIN.includes(s.trade) && has("sector_healthcare_phin_selfpay_growth")) {
    sect = line("sector", `Self-pay admissions to private hospitals grew ${v("sector_healthcare_phin_selfpay_growth")}% in ${first(byId.sector_healthcare_phin_selfpay_growth.period)} on the year before.`, ["sector_healthcare_phin_selfpay_growth"]);
  } else if (key === "hospitality" && sector === "hospitality" && set("season") && s.season && s.season !== "steady" && has("sector_hospitality_ons_food_beverage_3m", "sector_hospitality_ons_accommodation_3m")) {
    sect = line("sector", `Food and beverage output ${moved(v("sector_hospitality_ons_food_beverage_3m"))} over three months while accommodation ${moved(v("sector_hospitality_ons_accommodation_3m"))}; your seasonality answer decides which side you are on.`, ["sector_hospitality_ons_food_beverage_3m", "sector_hospitality_ons_accommodation_3m"]);
  } else if (key === "home-services" && sector === "construction" && has("sector_construction_ons_rm_monthly", "sector_construction_ons_rm_3m")) {
    /* the month beside the three months, both from rows; said to the building trades only, which the series measures */
    sect = line("sector", `Repair and maintenance output ${moved(v("sector_construction_ons_rm_monthly"))} in ${first(byId.sector_construction_ons_rm_monthly.period)} and ${moved(v("sector_construction_ons_rm_3m"))} over the ${byId.sector_construction_ons_rm_3m.period}.`, ["sector_construction_ons_rm_monthly", "sector_construction_ons_rm_3m"]);
  } else if (key === "e-commerce" && sector === "retail" && has("sector_retail_ons_online_share", "sector_retail_ons_online_values_yoy")) {
    sect = line("sector", `Online is ${v("sector_retail_ons_online_share")}% of retail sales and online values grew ${v("sector_retail_ons_online_values_yoy")}% on the year.`, ["sector_retail_ons_online_share", "sector_retail_ons_online_values_yoy"]);
  } else if (key === "b2b-saas" && sector === "tech" && has("sector_software_ons_computer_programming_monthly")) {
    sect = line("sector", `Computer programming output grew ${v("sector_software_ons_computer_programming_monthly")}% in ${first(byId.sector_software_ons_computer_programming_monthly.period)}, the largest single contributor to GDP growth that month.`, ["sector_software_ons_computer_programming_monthly"]);
  }

  /* no line yet: one of the visitor's own answers against a row already held (fix 3, C17d) */
  if (!head && !sect) {
    const team = set("teamSize") ? Math.round(Number(s.teamSize)) : 0;
    if (raised === "recent" && has("cpi_annual")) head = line("headline", `You raised prices in the last year. CPI rose ${v("cpi_annual")}% in the year to ${byId.cpi_annual.period}: a rise smaller than that fell behind it.`, ["cpi_annual"]);
    else if (raised === "while" && has("cpi_annual")) head = line("headline", `Your last price rise was one to three years ago. CPI rose ${v("cpi_annual")}% in the year to ${byId.cpi_annual.period}: a price held flat through that year fell that far behind.`, ["cpi_annual"]);
    else if (set("hiring") && (s.hiring === "now" || s.hiring === "steady") && has("regular_pay_growth")) head = line("headline", `You would hire ${s.hiring === "now" ? "now" : "once work is steady"}. Regular pay grew ${v("regular_pay_growth")}% on the year, ${byId.regular_pay_growth.period}.`, ["regular_pay_growth"]);
    else if (team >= 2 && has("bics_staffing_costs_up")) head = line("headline", `You have a team of ${team}. ${v("bics_staffing_costs_up")}% of businesses said their staffing costs rose over the last three months.`, ["bics_staffing_costs_up"]);
  }
  return [head, sect].filter(Boolean);
}

/** for a sector with no series of its own, the small line that says so. It sits in the foot, under the ▾, never on the
    card face (fix 3, C17d), and never prints for a sector whose rows are shown (C17b, C40.2: hospitality) */
function noSeries(state) {
  const s = state ?? M.state ?? {};
  const sector = s.sector;
  if (!sector) return "";
  const key = typeof M.contentKey === "function" ? M.contentKey() : null;
  if (hasSeries(key, sector)) return "";
  const word = sector !== "other" && typeof M.sectorWord === "function" ? M.sectorWord(sector).toLowerCase() : "your industry";
  return `Mercer holds no sector series for ${word}.`;
}

/** refine 1, R15: the sourced line for one question, said in the interview after it is answered. `context(id)` gives the
    same object a rule line is ({ text, sentence, ids, source, date, asOfIso }) or null; `contextFor(id)` gives its text.
    Every figure is a row's value, the text ends with the source word and the UK as-of date, and a question no row bears
    on gives null, so the caller falls back to a method line and no figure is ever made up. Mercer holds no regional
    series: Location gets the UK figure and says so. A projection is called one in the sentence. */
function context(id, state) {
  const s = state ?? M.state ?? {};
  const v = (rid) => byId[rid]?.value;
  const has = (...ids) => ids.every((rid) => byId[rid] && byId[rid].value !== undefined && byId[rid].value !== null);
  const set = (qid) => { try { return !(s.notSure?.has?.(qid) || s.na?.has?.(qid)); } catch (e) { return true; } };
  const moved = (x) => `${Number(x) < 0 ? "fell" : "rose"} ${Math.abs(Number(x))}%`;
  const first = (period) => String(period ?? "").split(" vs ")[0];
  const ctx = (sentence, ids) => (has(...ids) ? sourcedLine("context", sentence, ids) : null);
  const bankRate = () => ctx(`Bank Rate is ${v("boe_bank_rate")}%, held at the ${byId.boe_bank_rate?.period}.`, ["boe_bank_rate"]);
  if (!set(id)) return null;
  switch (id) {
    case "sector": {
      const sector = s.sector;
      if (sector === "professional") return ctx(`Professional, scientific and technical output ${moved(v("sector_profserv_ons_output_3m"))} over the ${byId.sector_profserv_ons_output_3m?.period}.`, ["sector_profserv_ons_output_3m"]);
      if (sector === "health" && !NOT_PHIN.includes(s.trade)) return ctx(`Self-pay admissions to private hospitals grew ${v("sector_healthcare_phin_selfpay_growth")}% in ${first(byId.sector_healthcare_phin_selfpay_growth?.period)} on the year before.`, ["sector_healthcare_phin_selfpay_growth"]);
      if (sector === "hospitality") return ctx(`Food and beverage output ${moved(v("sector_hospitality_ons_food_beverage_3m"))} over three months while accommodation ${moved(v("sector_hospitality_ons_accommodation_3m"))}.`, ["sector_hospitality_ons_food_beverage_3m", "sector_hospitality_ons_accommodation_3m"]);
      if (sector === "construction") return ctx(`Repair and maintenance output ${moved(v("sector_construction_ons_rm_monthly"))} in ${first(byId.sector_construction_ons_rm_monthly?.period)} and ${moved(v("sector_construction_ons_rm_3m"))} over the ${byId.sector_construction_ons_rm_3m?.period}.`, ["sector_construction_ons_rm_monthly", "sector_construction_ons_rm_3m"]);
      if (sector === "retail") return ctx(`Online is ${v("sector_retail_ons_online_share")}% of retail sales and online values grew ${v("sector_retail_ons_online_values_yoy")}% on the year.`, ["sector_retail_ons_online_share", "sector_retail_ons_online_values_yoy"]);
      if (sector === "tech") return ctx(`Computer programming output grew ${v("sector_software_ons_computer_programming_monthly")}% in ${first(byId.sector_software_ons_computer_programming_monthly?.period)}.`, ["sector_software_ons_computer_programming_monthly"]);
      return null;
    }
    case "place": {
      /* the gazetteer is UK only, so a matched place is a UK place; with no match nothing is said */
      let at = null;
      try { at = typeof M.locate === "function" ? M.locate() : null; } catch (e) { at = null; }
      if (!at) return null;
      return ctx(`Mercer holds no regional series. Across the UK, GDP grew ${v("gdp_qoq")}% in ${first(byId.gdp_qoq?.period)} on the quarter before.`, ["gdp_qoq"]);
    }
    case "priceRaised":
      if (!s.priceRaised) return null;
      return ctx(`CPI is ${v("cpi_annual")}% and the Bank projects about ${v("boe_cpi_projection_q4_2026")}% by ${byId.boe_cpi_projection_q4_2026?.period} (a projection).`, ["cpi_annual", "boe_cpi_projection_q4_2026"]);
    case "hiring":
      if (!s.hiring) return null;
      return ctx(`Regular pay grew ${v("regular_pay_growth")}% on the year, ${byId.regular_pay_growth?.period}, and pay settlements reported for 2026 average about ${v("boe_agents_pay_settlements_2026")}%.`, ["regular_pay_growth", "boe_agents_pay_settlements_2026"]);
    case "teamSize":
      if (!(Math.round(Number(s.teamSize)) >= 2)) return null;
      return ctx(`${v("bics_staffing_costs_up")}% of businesses said their staffing costs rose over the last three months.`, ["bics_staffing_costs_up"]);
    case "terms":
      if (!s.terms) return null;
      return ctx(`Bank Rate is ${v("boe_bank_rate")}%: money owed to you costs that much a year or more to wait for.`, ["boe_bank_rate"]);
    case "funding":
      return Array.isArray(s.funding) && s.funding.includes("loan") ? bankRate() : null;
    default:
      return null;
  }
}
const contextFor = (id, state) => context(id, state)?.text ?? null;
/** the question ids a row can bear on, for the caller that plans where a method line goes instead */
const CONTEXT_IDS = ["sector", "place", "priceRaised", "hiring", "teamSize", "terms", "funding"];

const FOOT = "Read on 19 September 2026. Nothing here is a forecast of the economy, and Mercer’s forecast does not use these figures.";
const foot = (state) => [FOOT, noSeries(state)].filter(Boolean).join(" ");

/** rebuild 1 (R9, brief 10.4): one row as `source` evidence for the plan and the model. The id is accepted with or without
    the `src:` prefix; the object carries the title, the source date (the row's asOf), the retrieval date (the day the
    rows were read), the link and the row's own line as the excerpt. Every row is a UK figure, and says so. null for an
    id that is not a row */
const RETRIEVED_AT = "2026-09-19";
function evidenceFor(id) {
  const rid = String(id ?? "").replace(/^src:/, "");
  const r = byId[rid];
  if (!r) return null;
  return {
    id: `src:${rid}`, row: rid, state: "source", label: "Source",
    title: r.label, value: r.value, unit: r.unit, period: r.period,
    sourceTitle: r.source, sourceUrl: r.url, sourceDate: r.asOf, retrievedAt: RETRIEVED_AT,
    excerpt: rowLine(r), projection: isProjection(r), scope: "UK figure", note: r.note ?? null,
  };
}
/** every row as evidence, for a caller that lists the sources behind a report */
const evidenceAll = () => rows.map((r) => evidenceFor(r.id));
/** rebuild 1 (R22): the rows are UK figures. They apply when app.js says the benchmarks do (M.ukBenchmarks), else when the
    state's currency is GBP. A caller outside that skips the weather lines and the rows; the plan still works on the
    visitor's own figures */
const applies = (state) => {
  try { if (typeof M.ukBenchmarks === "function") return !!M.ukBenchmarks(); } catch (e) { /* the currency below */ }
  return ((state ?? M.state ?? {}).currency ?? "GBP") === "GBP";
};

/* M.macro.FOOT is read by the card, the markdown and the PDF as the small last line. It is a getter so that line carries the
   no-series sentence for the sectors it is true of, with no change to the files that print it; FOOT_BASE is the fixed part */
M.macro = {
  rows, byId, forKey, headline, rowLine, isProjection, weatherLines, HEADLINE, PROJECTIONS, SECTOR_ROWS, ROW_SECTORS,
  ukDate, sourceWord, noSeries, foot, FOOT_BASE: FOOT,
  context, contextFor, CONTEXT_IDS,
  evidenceFor, evidenceAll, RETRIEVED_AT, applies,
  get FOOT() { return foot(M.state); },
};
})();
