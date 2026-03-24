import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import NexaGameCard from "./NexaGameCard";
import { colors } from "../../theme/nexaTokens";
import { spacing } from "../../theme/nexaSpacing";
import { typography } from "../../theme/nexaTypography";
import { sharedStyles } from "../../theme/nexaStyles";
import {
  getBottomContentPadding,
  scaleByWidth,
  scaleByHeight,
} from "../../theme/nexaLayout";

// Scaled spacing for filter and form panels (account for different screen sizes)
const panelPadding = scaleByWidth(spacing.spaceLg);
const filterPanelPadding = panelPadding * 0.5;
const gapBetweenPanels = scaleByHeight(spacing.spaceLg);
const filterRowGap = scaleByHeight(spacing.spaceSm);
const inputMinHeight = Math.max(48, scaleByHeight(52));
const inputMaxHeight = scaleByHeight(120);
const inputPadding = scaleByWidth(spacing.spaceMd);
const formSectionGap = scaleByHeight(spacing.spaceMd);
// Compact dropdown dimensions (small, compact)
const pickerMinHeight = Math.max(22, scaleByHeight(48));
const pickerMinHeightHalf = Math.max(11, pickerMinHeight / 1);
const pickerMinWidth = scaleByWidth(104);
const pickerPaddingH = scaleByWidth(spacing.spaceXs);
const pickerFontSize = 11;

const genreOptions = [
  "Action",
  "RPG",
  "Strategy",
  "Horror",
  "Shooter",
  "Adventure",
];
const platformOptions = ["PC", "PlayStation", "Xbox", "Switch", "Mobile"];
const yearOptions = [
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2010-2019",
  "2000-2009",
];
const modeOptions = ["Singleplayer", "Multiplayer", "Co-op", "MMO"];
const artStyleOptions = ["Pixel", "3D", "Cartoon", "Realistic"];
const perspectiveOptions = ["First-person", "Third-person", "Top-down"];
const difficultyOptions = ["Casual", "Hardcore", "Challenging"];
const popularityOptions = ["Trending", "Hidden Gems", "Critically Acclaimed"];
const priceOptions = ["Free", "Under $20", "$20-$40", "$40+"];
const scoreOptions = ["80+", "70+", "60+", "Any"];

const basicFilterOptions = [
  { key: "genre", label: "Genre", options: genreOptions },
  { key: "platform", label: "Platform", options: platformOptions },
  { key: "year", label: "Year", options: yearOptions },
  { key: "mode", label: "Mode", options: modeOptions },
  { key: "popularity", label: "Popularity", options: popularityOptions },
  { key: "price", label: "Price", options: priceOptions },
];
const advancedFilterOptions = [
  { key: "art_style", label: "Art Style", options: artStyleOptions },
  { key: "perspective", label: "Perspective", options: perspectiveOptions },
  { key: "difficulty", label: "Difficulty", options: difficultyOptions },
  { key: "score", label: "Score", options: scoreOptions },
];

const filterOrder = [
  "genre",
  "platform",
  "year",
  "mode",
  "popularity",
  "price",
  "art_style",
  "perspective",
  "difficulty",
  "score",
];

const SELECTORS_PER_ROW = 3;
function chunkFilters(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
const filterLabels = {
  genre: (v) => `${v} games`,
  platform: (v) => `for ${v}`,
  year: (v) => `released in ${v}`,
  mode: (v) => `${v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()}`,
  art_style: (v) => `${v} art style`,
  perspective: (v) => `${v} perspective`,
  difficulty: (v) =>
    `${v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()} difficulty`,
  popularity: (v) => `Popularity: ${v.toUpperCase()}`,
  price: (v) => `priced ${v.toUpperCase()}`,
  score: (v) => `with score above ${v}`,
};

function buildPromptPreview(filters, preference) {
  const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  let filterParts = [];
  filterOrder.forEach((key) => {
    if (filters[key]) {
      filterParts.push(filterLabels[key](filters[key]));
    }
  });
  const naturalList = (arr) => {
    if (arr.length === 0) return "";
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
    return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
  };
  const filterStr = naturalList(filterParts);
  if (filterStr && preference) {
    return {
      intro: `Showing recommendations for ${filterStr} and your interest `,
      bold: `"${preference}"`,
      end: ".",
    };
  }
  if (filterStr) {
    return {
      intro: `Showing recommendations for ${filterStr}.`,
      bold: "",
      end: "",
    };
  }
  if (preference) {
    return {
      intro: "Showing recommendations for your interest ",
      bold: `"${preference}"`,
      end: ".",
    };
  }
  return { intro: "Showing recommendations.", bold: "", end: "" };
}

const BLUR_INTENSITY = 50;
const styles = StyleSheet.create({
  listContent: { paddingBottom: spacing.space2xl },
  // Repo uses backdrop-filter: blur(10px) + glass-white; container has border only, blur+overlay inside
  glassPanelBorder: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glassWhite,
  },
  filterPanel: {
    width: "100%",
    padding: filterPanelPadding,
    marginBottom: gapBetweenPanels,
    borderRadius: 20,
    alignItems: "center",
    position: "relative",
  },
  formPanel: {
    padding: panelPadding,
    marginBottom: spacing.spaceMd,
    borderRadius: 20,
    position: "relative",
    overflow: "hidden",
  },
  panelTitle: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.textLarge,
    fontWeight: "700",
    color: colors.text,
    marginBottom: scaleByHeight(spacing.spaceXs),
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  panelTitleGradient: {},
  filterRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: filterRowGap,
  },
  filterRowPickers: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  advancedRow: { marginTop: scaleByHeight(spacing.spaceXs) },
  pickerWrap: {
    width: 120,
    minWidth: 120,
    maxWidth: 120,
    flex: 0,
  },
  pickerHeightWrap: {
    height: pickerMinHeightHalf,
    minHeight: pickerMinHeightHalf,
    maxHeight: pickerMinHeightHalf,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 8,
  },
  filterRowOfFour: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-end",
    alignSelf: "center",
    gap: scaleByWidth(spacing.spaceMd),
    marginTop: scaleByHeight(spacing.spaceSm),
    marginBottom: filterRowGap,
  },
  pickerLabel: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  picker: {
    color: colors.textPrimary,
    backgroundColor: colors.bgField,
    borderRadius: 8,
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: pickerFontSize,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    height: pickerMinHeightHalf,
    maxHeight: pickerMinHeightHalf,
    minHeight: 0,
  },
  advancedOptionsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: scaleByHeight(spacing.spaceXs),
  },
  advancedOptionsText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textSmall,
    color: colors.textSecondary,
  },
  surpriseBtnRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: scaleByHeight(spacing.spaceMd),
    marginBottom: filterRowGap,
  },
  surpriseBtnPressable: {
    borderRadius: 8,
    overflow: "hidden",
  },
  surpriseBtn: {
    paddingVertical: scaleByHeight(spacing.spaceXs),
    paddingHorizontal: scaleByWidth(spacing.spaceSm),
    backgroundColor: colors.neonTealDark,
    borderRadius: 4,
  },
  surpriseBtnText: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.textSmall,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.text,
  },
  chipsRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  chipsScroll: { maxHeight: scaleByHeight(44), marginRight: spacing.spaceSm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgPanel,
    paddingVertical: spacing.spaceXs,
    paddingLeft: spacing.spaceSm,
    paddingRight: spacing.spaceXs,
    borderRadius: 8,
    marginRight: spacing.spaceSm,
    marginBottom: filterRowGap,
  },
  chipText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textSmall,
    color: colors.textPrimary,
    marginRight: spacing.spaceXs,
  },
  chipRemove: { padding: spacing.spaceXs },
  chipRemoveText: { fontSize: 18, color: colors.textSecondary },
  clearAllBtn: {
    paddingVertical: spacing.spaceXs,
    paddingHorizontal: spacing.spaceSm,
  },
  clearAllText: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textSmall,
    color: colors.neonPink,
  },
  formLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textBase,
    color: colors.textPrimary,
    marginBottom: formSectionGap,
  },
  inputWrap: {
    position: "relative",
    marginBottom: formSectionGap,
  },
  input: {
    width: "100%",
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textBase,
    color: colors.textPrimary,
    backgroundColor: colors.bgField,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 8,
    padding: inputPadding,
    minHeight: inputMinHeight,
    maxHeight: inputMaxHeight,
    textAlignVertical: "top",
  },
  inputPlaceholderWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: inputMinHeight,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    pointerEvents: "none",
    padding: inputPadding,
  },
  inputPlaceholder: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  formFooter: {
    width: "100%",
    marginTop: scaleByHeight(spacing.spaceMd),
    paddingVertical: scaleByHeight(spacing.spaceSm),
    paddingHorizontal: 0,
    alignItems: "center",
  },
  hint: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textSmall,
    color: colors.textSecondary,
    textAlign: "center",
  },
  promptPreviewWrap: { marginBottom: formSectionGap },
  promptPreview: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textSmall,
    color: colors.textSecondary,
  },
  promptPreviewBold: {
    fontFamily: typography.fontBodyBold,
    color: colors.neonTeal,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: formSectionGap,
  },
  sortLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textBase,
    color: colors.textPrimary,
    marginRight: scaleByWidth(spacing.spaceSm),
  },
  sortPickerWrap: {
    flex: 1,
    minHeight: pickerMinHeight,
    justifyContent: "center",
  },
  sortPicker: {
    color: colors.textPrimary,
    fontSize: pickerFontSize,
    marginLeft: 0,
  },
  submitBtnPressable: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: scaleByHeight(spacing.spaceMd),
  },
  submitBtn: {
    paddingVertical: scaleByHeight(spacing.spaceMd),
    paddingHorizontal: scaleByWidth(spacing.spaceLg),
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.textBase,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.text,
  },
  errorWrap: {
    padding: panelPadding,
    backgroundColor: colors.error + "20",
    borderRadius: 8,
    marginBottom: spacing.spaceMd,
  },
  errorText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textBase,
    color: colors.error,
  },
  loadingWrap: {
    padding: scaleByHeight(spacing.spaceLg),
    alignItems: "center",
  },
  messagePanel: {
    padding: panelPadding,
    marginBottom: spacing.spaceMd,
  },
  messageTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textMedium,
    color: colors.textPrimary,
  },
  messageText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textBase,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

function RecommendationListHeader({
  styles: s,
  preference,
  onInputChange,
  filters,
  onFilterChange,
  filterChips,
  onRemoveChip,
  onClearAllFilters,
  onSurpriseMe,
  showAdvancedFilters,
  onToggleAdvanced,
  promptPreview,
  sortBy,
  onSortChange,
  loading,
  onSubmit,
  error,
  explain,
  aiDown,
  aiDownMessage,
}) {
  return (
    <View>
      <View style={[s.filterPanel, s.glassPanelBorder]}>
        <BlurView
          intensity={BLUR_INTENSITY}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={s.glassOverlay} />
        <MaskedView
          maskElement={
            <Text style={s.panelTitle}>TACTICAL FILTERS</Text>
          }
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.panelTitleGradient}
          >
            <Text style={[s.panelTitle, { opacity: 0 }]}>TACTICAL FILTERS</Text>
          </LinearGradient>
        </MaskedView>
        {chunkFilters(basicFilterOptions, SELECTORS_PER_ROW).map(
          (row, rowIndex) => (
            <View key={`basic-${rowIndex}`} style={s.filterRowOfFour}>
              {row.map(({ key, label, options }) => (
                <View key={key} style={s.pickerWrap}>
                  <Text style={s.pickerLabel}>{label}</Text>
                  <View style={s.pickerHeightWrap}>
                    <Picker
                      selectedValue={filters[key] || ""}
                      onValueChange={(v) => onFilterChange(key, v)}
                      style={s.picker}
                      dropdownIconColor={colors.textPrimary}
                      mode={Platform.OS === "android" ? "dialog" : "dropdown"}
                      prompt={Platform.OS === "android" ? label : undefined}
                      itemStyle={
                        Platform.OS === "ios"
                          ? { fontSize: pickerFontSize }
                          : undefined
                      }
                    >
                      <Picker.Item label={label} value="" />
                      {options.map((opt) => (
                        <Picker.Item key={opt} label={opt} value={opt} />
                      ))}
                    </Picker>
                  </View>
                </View>
              ))}
            </View>
          )
        )}
        {showAdvancedFilters &&
          chunkFilters(advancedFilterOptions, SELECTORS_PER_ROW).map(
            (row, rowIndex) => (
              <View
                key={`advanced-${rowIndex}`}
                style={[s.filterRowOfFour, s.advancedRow]}
              >
                {row.map(({ key, label, options }) => (
                  <View key={key} style={s.pickerWrap}>
                    <Text style={s.pickerLabel}>{label}</Text>
                    <View style={s.pickerHeightWrap}>
                      <Picker
                        selectedValue={filters[key] || ""}
                        onValueChange={(v) => onFilterChange(key, v)}
                        style={s.picker}
                        dropdownIconColor={colors.textPrimary}
                        mode={Platform.OS === "android" ? "dialog" : "dropdown"}
                        prompt={Platform.OS === "android" ? label : undefined}
                        itemStyle={
                          Platform.OS === "ios"
                            ? { fontSize: pickerFontSize }
                            : undefined
                        }
                      >
                        <Picker.Item label={label} value="" />
                        {options.map((opt) => (
                          <Picker.Item key={opt} label={opt} value={opt} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                ))}
              </View>
            )
          )}
        <View style={s.surpriseBtnRow}>
          <Pressable onPress={onSurpriseMe} style={s.surpriseBtnPressable}>
            <LinearGradient
              colors={['rgba(26, 255, 26, 0.75)', colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.surpriseBtn}
            >
              <Text style={s.surpriseBtnText}>🎲 Surprise Me</Text>
            </LinearGradient>
          </Pressable>
        </View>
        {filterChips.length > 0 && (
          <View style={s.chipsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.chipsScroll}
            >
              {filterChips.map((chip, i) => (
                <View key={chip.filter + chip.value + i} style={s.chip}>
                  <Text style={s.chipText}>
                    {chip.filter}: {chip.value}
                  </Text>
                  <Pressable
                    onPress={() => onRemoveChip(chip)}
                    style={s.chipRemove}
                    hitSlop={8}
                  >
                    <Text style={s.chipRemoveText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <Pressable onPress={onClearAllFilters} style={s.clearAllBtn}>
              <Text style={s.clearAllText}>Clear All</Text>
            </Pressable>
          </View>
        )}
        <View style={s.advancedOptionsRow}>
          <Pressable onPress={onToggleAdvanced}>
            <Text style={s.advancedOptionsText}>
              {showAdvancedFilters
                ? "Hide Advanced Filters"
                : "Advanced Filters"}
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={[s.formPanel, s.glassPanelBorder]}>
        <BlurView
          intensity={BLUR_INTENSITY}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={s.glassOverlay} />
        <Text style={s.formLabel}>What kind of games do you like?</Text>
        <View style={s.inputWrap}>
          <TextInput
            value={preference}
            onChangeText={onInputChange}
            placeholder=""
            placeholderTextColor={colors.textSecondary}
            style={s.input}
            maxLength={200}
            multiline
            scrollEnabled
          />
          {!preference.trim() && (
            <View style={s.inputPlaceholderWrap}>
              <Text
                style={s.inputPlaceholder}
                numberOfLines={3}
                allowFontScaling={false}
              >
                e.g. Games like Skyrim with magic, and crafting
              </Text>
            </View>
          )}
        </View>
        {(preference.trim() || Object.keys(filters).length > 0) && (
          <View style={s.promptPreviewWrap}>
            <Text style={s.promptPreview}>
              {promptPreview.intro}
              <Text style={s.promptPreviewBold}>{promptPreview.bold}</Text>
              {promptPreview.end}
            </Text>
          </View>
        )}
        <View style={s.sortRow}>
          <Text style={s.sortLabel}>Sort by:</Text>
          <View style={s.sortPickerWrap}>
            <Picker
              selectedValue={sortBy}
              onValueChange={onSortChange}
              style={s.sortPicker}
              dropdownIconColor={colors.textPrimary}
              mode={Platform.OS === "android" ? "dialog" : "dropdown"}
              prompt={Platform.OS === "android" ? "Sort by" : undefined}
              itemStyle={
                Platform.OS === "ios" ? { fontSize: pickerFontSize } : undefined
              }
            >
              <Picker.Item label="Release Date" value="release_date" />
              <Picker.Item label="Rating" value="rating" />
              <Picker.Item label="Metacritic Score" value="metacritic" />
            </Picker>
          </View>
        </View>
        <Pressable
          style={[s.submitBtnPressable, loading && s.submitBtnDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.submitBtn}
          >
            <Text style={s.submitBtnText}>
              {loading ? "Loading..." : "Get Recommendations"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
      <View style={s.formFooter}>
        <Text style={s.hint}>
          Powered by GPT-4o AI Gaming Expert – understands game mechanics,
          player psychology, and gaming culture!
        </Text>
      </View>
      {error ? (
        <View style={s.errorWrap}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.neonTeal} />
        </View>
      ) : null}
      {aiDown ? (
        <View style={[sharedStyles.glassPanel, s.messagePanel]}>
          <Text style={s.messageTitle}>{aiDownMessage}</Text>
        </View>
      ) : null}
      {!aiDown && explain ? (
        <View style={[sharedStyles.glassPanel, s.messagePanel]}>
          <Text style={s.messageText}>{explain}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function NexaGameRecommender({
  onGetRecommendations,
  games,
  loading,
  onViewDetails,
  error,
  explain,
  filters,
  setFilters,
  aiDown,
  aiDownMessage,
}) {
  const [preference, setPreference] = useState("");
  const [sortBy, setSortBy] = useState("metacritic");
  const [filterChips, setFilterChips] = useState([]);
  const [promptPreview, setPromptPreview] = useState({
    intro: "Showing recommendations.",
    bold: "",
    end: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleFilterChange = (filter, value) => {
    if (value) {
      setFilters((prev) => ({ ...prev, [filter]: value }));
      setFilterChips((prev) => {
        if (prev.some((c) => c.filter === filter && c.value === value))
          return prev;
        return [...prev.filter((c) => c.filter !== filter), { filter, value }];
      });
    } else {
      setFilters((prev) => {
        const next = { ...prev };
        delete next[filter];
        return next;
      });
      setFilterChips((prev) => prev.filter((c) => c.filter !== filter));
    }
  };

  const handleRemoveChip = (chipToRemove) => {
    setFilterChips((prev) => prev.filter((c) => c !== chipToRemove));
    setFilters((prev) => {
      const next = { ...prev };
      delete next[chipToRemove.filter];
      return next;
    });
  };

  const handleClearAllFilters = () => {
    setFilterChips([]);
    setFilters({});
  };

  const handleSurpriseMe = () => {
    const randomGenre =
      genreOptions[Math.floor(Math.random() * genreOptions.length)];
    const randomPlatform =
      platformOptions[Math.floor(Math.random() * platformOptions.length)];
    handleFilterChange("genre", randomGenre);
    handleFilterChange("platform", randomPlatform);
  };

  useEffect(() => {
    setPromptPreview(buildPromptPreview(filters, preference));
  }, [filters, preference]);

  const handleSubmit = () => {
    if (preference.trim()) {
      onGetRecommendations(preference, sortBy, filters);
    }
  };

  const handleInputChange = (text) => {
    setPreference(text);
  };

  const gamesList = Array.isArray(games) ? games.slice(0, 19) : [];

  const keyExtractor = useCallback(
    (item, index) =>
      item.id != null ? String(item.id) : `${item.title}-${index}`,
    []
  );
  const renderItem = useCallback(
    ({ item }) => (
      <NexaGameCard game={item} onViewDetails={() => onViewDetails(item)} />
    ),
    [onViewDetails]
  );

  const headerElement = (
    <RecommendationListHeader
      styles={styles}
      preference={preference}
      onInputChange={handleInputChange}
      filters={filters}
      onFilterChange={handleFilterChange}
      filterChips={filterChips}
      onRemoveChip={handleRemoveChip}
      onClearAllFilters={handleClearAllFilters}
      onSurpriseMe={handleSurpriseMe}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvanced={() => setShowAdvancedFilters((p) => !p)}
      promptPreview={promptPreview}
      sortBy={sortBy}
      onSortChange={setSortBy}
      loading={loading}
      onSubmit={handleSubmit}
      error={error}
      explain={explain}
      aiDown={aiDown}
      aiDownMessage={aiDownMessage}
    />
  );

  return (
    <FlatList
      data={gamesList}
      keyExtractor={keyExtractor}
      ListHeaderComponent={headerElement}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: getBottomContentPadding() },
      ]}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
    />
  );
}
