import type { ComponentProps, ReactElement } from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { getDiaryHourLabels, mapTimelineItemsToGrid } from "@/lib/diary/aasm-grid";
import { AASM_EVENT_LEGEND, getTimelineItemPresentation } from "@/lib/diary/aasm-presentation";
import type { WeeklyExportData, WeeklyExportGridDay, WeeklyExportGridItem } from "@/lib/diary/weekly-export";

const HOUR_COLUMN_WIDTH = 24;
const DATE_COLUMN_WIDTH = 58;
const WEEKDAY_COLUMN_WIDTH = 52;
const DAY_TYPE_COLUMN_WIDTH = 64;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    color: "#0f172a",
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 7,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#4f46e5",
    marginBottom: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 7,
    color: "#334155",
  },
  headerMeta: {
    fontSize: 6,
    color: "#475569",
    textAlign: "right",
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  metricCard: {
    flexBasis: 0,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 5,
    marginRight: 4,
  },
  metricLabel: {
    fontSize: 5,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 7,
    fontWeight: 700,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 6,
  },
  legendLabel: {
    fontSize: 6,
    fontWeight: 700,
    color: "#475569",
    marginRight: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingVertical: 2,
    paddingLeft: 2,
    paddingRight: 6,
    marginRight: 4,
    marginBottom: 2,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  legendCode: {
    fontSize: 5,
    fontWeight: 700,
  },
  legendText: {
    fontSize: 6,
    color: "#334155",
  },
  tableHint: {
    fontSize: 6,
    color: "#64748b",
    marginBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: "row",
  },
  headerCell: {
    height: 22,
    justifyContent: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 3,
  },
  rowLabelCell: {
    height: 26,
    justifyContent: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 4,
  },
  hourCell: {
    width: HOUR_COLUMN_WIDTH,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  headerText: {
    fontSize: 5.5,
    fontWeight: 700,
    color: "#475569",
    textAlign: "center",
  },
  rowLabelText: {
    fontSize: 6,
    color: "#0f172a",
  },
  cellCode: {
    fontSize: 6.5,
    fontWeight: 700,
  },
});

type WeeklyDiaryDocumentProps = {
  data: WeeklyExportData;
};

export function WeeklyDiaryDocument({
  data,
}: WeeklyDiaryDocumentProps): ReactElement<ComponentProps<typeof Document>> {
  const gridItems = mapTimelineItemsToGrid(data.grid.days, data.grid.timelineItems);

  return (
    <Document title={`Sleepbook Weekly Diary ${data.dateRangeLabel}`} author="Sleepbook">
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Sleepbook</Text>
            <Text style={styles.title}>Weekly Sleep Diary Grid</Text>
            <Text style={styles.subtitle}>{data.dateRangeLabel}</Text>
          </View>
          <View>
            <Text style={styles.headerMeta}>Generated {data.generatedAtLabel}</Text>
            <Text style={styles.headerMeta}>Time zone: {data.timeZone}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          {data.metrics.map((metric, index) => (
            <View
              key={metric.label}
              style={[
                styles.metricCard,
                index === data.metrics.length - 1 ? { marginRight: 0 } : {},
              ]}
            >
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.legendRow}>
          <Text style={styles.legendLabel}>Legend</Text>
          {AASM_EVENT_LEGEND.map((item) => (
            <View key={item.code} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: item.pdfFillColor }]}>
                <Text style={[styles.legendCode, { color: item.pdfTextColor }]}>{item.code}</Text>
              </View>
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.tableHint}>Hourly grid runs left to right from noon through 11 AM.</Text>

        <View style={styles.table}>
          <GridHeaderRow />
          {data.grid.days.map((day) => (
            <GridDayRow key={day.id} day={day} gridItems={gridItems} />
          ))}
        </View>
      </Page>
    </Document>
  );
}

function GridHeaderRow() {
  const hourLabels = getDiaryHourLabels();

  return (
    <View style={styles.row}>
      <View style={[styles.headerCell, { width: DATE_COLUMN_WIDTH }]}>
        <Text style={styles.headerText}>DATE</Text>
      </View>
      <View style={[styles.headerCell, { width: WEEKDAY_COLUMN_WIDTH }]}>
        <Text style={styles.headerText}>DAY</Text>
      </View>
      <View style={[styles.headerCell, { width: DAY_TYPE_COLUMN_WIDTH }]}>
        <Text style={styles.headerText}>TYPE</Text>
      </View>
      {hourLabels.map((label) => (
        <View key={label} style={[styles.headerCell, { width: HOUR_COLUMN_WIDTH }]}>
          <Text style={styles.headerText}>{formatHourMarker(label)}</Text>
        </View>
      ))}
    </View>
  );
}

function GridDayRow({
  day,
  gridItems,
}: {
  day: WeeklyExportGridDay;
  gridItems: Map<string, WeeklyExportGridItem>;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowLabelCell, { width: DATE_COLUMN_WIDTH }]}>
        <Text style={styles.rowLabelText}>{day.dateLabel}</Text>
      </View>
      <View style={[styles.rowLabelCell, { width: WEEKDAY_COLUMN_WIDTH }]}>
        <Text style={styles.rowLabelText}>{day.weekdayLabel}</Text>
      </View>
      <View style={[styles.rowLabelCell, { width: DAY_TYPE_COLUMN_WIDTH }]}>
        <Text style={styles.rowLabelText}>{day.dayKindLabel}</Text>
      </View>
      {Array.from({ length: 24 }, (_, hourIndex) => {
        const item = gridItems.get(`${day.id}:${hourIndex}`);
        const presentation = item ? getTimelineItemPresentation(item) : null;

        return (
          <View
            key={`${day.id}-${hourIndex}`}
            style={[
              styles.hourCell,
              presentation
                ? {
                    backgroundColor: presentation.pdfFillColor,
                  }
                : {},
            ]}
          >
            <Text
              style={[
                styles.cellCode,
                presentation
                  ? {
                      color: presentation.pdfTextColor,
                    }
                  : { color: "#cbd5e1" },
              ]}
            >
              {presentation?.code ?? ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function formatHourMarker(label: string) {
  if (label === "Noon" || label === "Midnight") {
    return "12";
  }

  return label.split(" ")[0] ?? label;
}
