package com.community.communitybackend.service;

import com.community.communitybackend.dto.MainSummaryResponseDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.ExchangeRatePreviewDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.MarketStockPreviewDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.NewsPreviewDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.PostPreviewDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.ShoppingPreviewDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.WeatherPreviewDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.WebtoonPreviewDto;
import com.community.communitybackend.repository.PostRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainSummaryService {

    private static final int POST_PREVIEW_LIMIT = 6;
    private static final int NEWS_PREVIEW_LIMIT = 6;
    private static final int SHOPPING_PREVIEW_LIMIT = 10;
    private static final int WEBTOON_PREVIEW_LIMIT = 12;
    private static final int NEWS_IMAGE_FETCH_TIMEOUT_MS = 1200;
    private static final int NEWS_IMAGE_HTML_LIMIT_BYTES = 120_000;
    private static final int EXTERNAL_API_FETCH_TIMEOUT_MS = 2500;
    private static final int EXTERNAL_API_RESPONSE_LIMIT_BYTES = 200_000;
    private static final String NEWS_KEYWORD = "취업 실무";
    private static final String SHOPPING_KEYWORD = "취업 준비 아이템";
    private static final String WEATHER_LOCATION = "순천";
    private static final String NAVER_WEBTOON_WEEKDAY_API_URL =
            "https://comic.naver.com/api/webtoon/titlelist/weekday?week=";
    private static final String NAVER_WEBTOON_LIST_URL =
            "https://comic.naver.com/webtoon/list?titleId=";
    private static final String WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"
            + "?latitude=34.9506"
            + "&longitude=127.4872"
            + "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
            + "&daily=temperature_2m_max,temperature_2m_min"
            + "&timezone=Asia%2FSeoul"
            + "&forecast_days=1";
    private static final String EXCHANGE_API_URL = "https://api.frankfurter.app/latest?from=USD&to=KRW";
    private static final String YAHOO_CHART_API_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";
    private static final List<StockQuery> STOCK_QUERIES = List.of(
            new StockQuery("005930.KS", "삼성전자"),
            new StockQuery("000660.KS", "SK하이닉스"),
            new StockQuery("066570.KS", "LG전자")
    );
    private static final Pattern META_TAG_PATTERN = Pattern.compile(
            "<meta\\s+[^>]*>",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern IMAGE_META_PATTERN = Pattern.compile(
            "(?:property|name)\\s*=\\s*[\"'](?:og:image|twitter:image)[\"']",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern CONTENT_PATTERN = Pattern.compile(
            "content\\s*=\\s*[\"']([^\"']+)[\"']",
            Pattern.CASE_INSENSITIVE
    );

    private final PostRepository postRepository;
    private final SearchService searchService;

    public MainSummaryResponseDto getMainSummary() {
        List<PostPreviewDto> posts = postRepository
                .findByDeletedFalseOrderByCreatedAtDesc(PageRequest.of(0, POST_PREVIEW_LIMIT))
                .stream()
                .map(PostPreviewDto::new)
                .toList();

        NewsResult newsResult = loadNewsPreview();
        WeatherResult weatherResult = loadWeatherPreview();
        ExchangeResult exchangeResult = loadExchangeRatePreview();
        MarketResult marketResult = loadMarketStocks();
        ShoppingResult shoppingResult = loadShoppingPreview();
        WebtoonResult webtoonResult = loadWebtoonPreview();

        return new MainSummaryResponseDto(
                posts,
                newsResult.news(),
                weatherResult.weather(),
                exchangeResult.exchangeRate(),
                marketResult.marketStocks(),
                shoppingResult.shoppingItems(),
                webtoonResult.webtoonItems(),
                newsResult.error(),
                weatherResult.error(),
                exchangeResult.error(),
                marketResult.error(),
                shoppingResult.error(),
                webtoonResult.error()
        );
    }

    public List<ShoppingPreviewDto> getShoppingItems(String keyword) {
        String safeKeyword = normalizeKeyword(keyword, SHOPPING_KEYWORD);
        String responseBody = searchService.searchShopping(
                safeKeyword,
                1,
                SHOPPING_PREVIEW_LIMIT,
                "sim"
        );

        return parseShopping(responseBody);
    }

    public List<NewsPreviewDto> getNewsItems(String keyword) {
        String safeKeyword = normalizeKeyword(keyword, NEWS_KEYWORD);
        String responseBody = searchService.searchNews(safeKeyword, 1, NEWS_PREVIEW_LIMIT, "date");

        return parseNews(responseBody);
    }

    public List<WebtoonPreviewDto> getWebtoonItems(String week) {
        return requestWebtoonItems(normalizeWebtoonWeek(week));
    }

    private NewsResult loadNewsPreview() {
        try {
            return new NewsResult(getNewsItems(NEWS_KEYWORD), null);
        } catch (Exception e) {
            return new NewsResult(List.of(), e.getMessage());
        }
    }

    private List<NewsPreviewDto> parseNews(String responseBody) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode items = objectMapper.readTree(responseBody).path("items");
            List<NewsPreviewDto> news = new ArrayList<>();

            if (!items.isArray()) {
                return news;
            }

            for (JsonNode item : items) {
                String link = item.path("link").asText("");
                String originallink = item.path("originallink").asText("");

                news.add(new NewsPreviewDto(
                        item.path("title").asText(""),
                        link,
                        item.path("description").asText(""),
                        item.path("pubDate").asText(""),
                        originallink,
                        findNewsImageUrl(originallink, link)
                ));
            }

            return news;
        } catch (Exception e) {
            throw new IllegalStateException("뉴스 응답을 해석하지 못했습니다.", e);
        }
    }

    private WeatherResult loadWeatherPreview() {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(requestExternalText(WEATHER_API_URL));
            JsonNode current = root.path("current");
            JsonNode daily = root.path("daily");

            WeatherPreviewDto weather = new WeatherPreviewDto(
                    WEATHER_LOCATION,
                    current.path("temperature_2m").decimalValue(),
                    firstDecimalValue(daily.path("temperature_2m_max")),
                    firstDecimalValue(daily.path("temperature_2m_min")),
                    current.path("relative_humidity_2m").isMissingNode()
                            ? null
                            : current.path("relative_humidity_2m").asInt(),
                    current.path("wind_speed_10m").decimalValue(),
                    weatherCodeToText(current.path("weather_code").asInt()),
                    current.path("time").asText("")
            );

            return new WeatherResult(weather, null);
        } catch (Exception e) {
            return new WeatherResult(null, "날씨 정보를 불러오지 못했습니다.");
        }
    }

    private ExchangeResult loadExchangeRatePreview() {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(requestExternalText(EXCHANGE_API_URL));

            ExchangeRatePreviewDto exchangeRate = new ExchangeRatePreviewDto(
                    "USD",
                    "KRW",
                    root.path("rates").path("KRW").decimalValue(),
                    root.path("date").asText("")
            );

            return new ExchangeResult(exchangeRate, null);
        } catch (Exception e) {
            return new ExchangeResult(null, "환율 정보를 불러오지 못했습니다.");
        }
    }

    private ShoppingResult loadShoppingPreview() {
        try {
            return new ShoppingResult(getShoppingItems(SHOPPING_KEYWORD), null);
        } catch (Exception e) {
            return new ShoppingResult(List.of(), e.getMessage());
        }
    }

    private MarketResult loadMarketStocks() {
        try {
            List<MarketStockPreviewDto> marketStocks = new ArrayList<>();

            for (StockQuery stockQuery : STOCK_QUERIES) {
                MarketStockPreviewDto stock = loadMarketStock(stockQuery);

                if (stock != null) {
                    marketStocks.add(stock);
                }
            }

            return new MarketResult(marketStocks, null);
        } catch (Exception e) {
            return new MarketResult(List.of(), "증시 정보를 불러오지 못했습니다.");
        }
    }

    private MarketStockPreviewDto loadMarketStock(StockQuery stockQuery) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String requestUrl = YAHOO_CHART_API_URL
                    + stockQuery.symbol()
                    + "?range=5d&interval=1d";
            JsonNode root = objectMapper.readTree(requestExternalText(requestUrl));
            JsonNode meta = root.path("chart").path("result").path(0).path("meta");
            BigDecimal price = meta.path("regularMarketPrice").decimalValue();
            BigDecimal previousClose = meta.path("chartPreviousClose").decimalValue();

            if (previousClose.compareTo(BigDecimal.ZERO) == 0) {
                return null;
            }

            BigDecimal change = price.subtract(previousClose);
            BigDecimal changePercent = change
                    .multiply(BigDecimal.valueOf(100))
                    .divide(previousClose, 2, RoundingMode.HALF_UP);

            return new MarketStockPreviewDto(
                    stockQuery.symbol(),
                    stockQuery.name(),
                    price,
                    change,
                    changePercent,
                    meta.path("currency").asText("")
            );
        } catch (Exception e) {
            return null;
        }
    }

    private WebtoonResult loadWebtoonPreview() {
        try {
            return new WebtoonResult(getWebtoonItems(currentWebtoonWeek()), null);
        } catch (Exception e) {
            return new WebtoonResult(List.of(), e.getMessage());
        }
    }

    private List<WebtoonPreviewDto> requestWebtoonItems(String week) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            String encodedWeek = URLEncoder.encode(week, StandardCharsets.UTF_8);
            JsonNode root = objectMapper.readTree(
                    requestExternalText(NAVER_WEBTOON_WEEKDAY_API_URL + encodedWeek)
            );
            JsonNode items = extractWebtoonItems(root, week);
            List<WebtoonPreviewDto> webtoonItems = new ArrayList<>();

            if (!items.isArray()) {
                return webtoonItems;
            }

            for (JsonNode item : items) {
                String titleId = firstText(item, "titleId", "id");
                String link = titleId.isBlank()
                        ? firstText(item, "link", "url")
                        : NAVER_WEBTOON_LIST_URL + titleId;

                webtoonItems.add(new WebtoonPreviewDto(
                        firstText(item, "titleName", "title", "name"),
                        link,
                        firstText(item, "thumbnailUrl", "thumbnail", "imageUrl", "posterThumbnailUrl")
                ));

                if (webtoonItems.size() >= WEBTOON_PREVIEW_LIMIT) {
                    break;
                }
            }

            return webtoonItems;
        } catch (Exception e) {
            throw new IllegalStateException("네이버 웹툰 정보를 불러오지 못했습니다.", e);
        }
    }

    private JsonNode extractWebtoonItems(JsonNode root, String week) {
        JsonNode titleList = root.path("titleList");

        if (titleList.isArray()) {
            return titleList;
        }

        JsonNode titleListMap = root.path("titleListMap");
        JsonNode weekList = titleListMap.path(week.toUpperCase(Locale.ROOT));

        if (weekList.isArray()) {
            return weekList;
        }

        for (JsonNode value : root) {
            if (value.isArray()) {
                return value;
            }
        }

        return new ObjectMapper().createArrayNode();
    }

    private List<ShoppingPreviewDto> parseShopping(String responseBody) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode items = objectMapper.readTree(responseBody).path("items");
            List<ShoppingPreviewDto> shoppingItems = new ArrayList<>();

            if (!items.isArray()) {
                return shoppingItems;
            }

            for (JsonNode item : items) {
                shoppingItems.add(new ShoppingPreviewDto(
                        item.path("title").asText(""),
                        item.path("link").asText(""),
                        item.path("image").asText(""),
                        parsePrice(item.path("lprice").asText("")),
                        item.path("mallName").asText("")
                ));
            }

            return shoppingItems;
        } catch (Exception e) {
            throw new IllegalStateException("쇼핑 응답을 해석하지 못했습니다.", e);
        }
    }

    private String findNewsImageUrl(String originallink, String link) {
        String imageUrl = fetchOpenGraphImage(originallink);

        if (imageUrl != null) {
            return imageUrl;
        }

        return fetchOpenGraphImage(link);
    }

    private String fetchOpenGraphImage(String pageUrl) {
        if (pageUrl == null || pageUrl.isBlank()) {
            return null;
        }

        try {
            URL url = new URL(pageUrl);
            String protocol = url.getProtocol();

            if (!"http".equalsIgnoreCase(protocol) && !"https".equalsIgnoreCase(protocol)) {
                return null;
            }

            URLConnection connection = url.openConnection();
            connection.setConnectTimeout(NEWS_IMAGE_FETCH_TIMEOUT_MS);
            connection.setReadTimeout(NEWS_IMAGE_FETCH_TIMEOUT_MS);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");
            connection.setRequestProperty("Accept", "text/html,application/xhtml+xml");

            try (InputStream inputStream = connection.getInputStream()) {
                String html = readLimitedHtml(inputStream);
                String imageUrl = extractOpenGraphImage(html);

                return normalizeImageUrl(imageUrl, url);
            }
        } catch (Exception e) {
            return null;
        }
    }

    private String requestExternalText(String apiUrl) throws Exception {
        URL url = new URL(apiUrl);
        URLConnection connection = url.openConnection();
        connection.setConnectTimeout(EXTERNAL_API_FETCH_TIMEOUT_MS);
        connection.setReadTimeout(EXTERNAL_API_FETCH_TIMEOUT_MS);
        connection.setRequestProperty("User-Agent", "Mozilla/5.0");

        try (InputStream inputStream = connection.getInputStream()) {
            return readLimitedText(inputStream, EXTERNAL_API_RESPONSE_LIMIT_BYTES);
        }
    }

    private String readLimitedHtml(InputStream inputStream) throws Exception {
        return readLimitedText(inputStream, NEWS_IMAGE_HTML_LIMIT_BYTES);
    }

    private String readLimitedText(InputStream inputStream, int limitBytes) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int totalBytes = 0;
        int readBytes;

        while ((readBytes = inputStream.read(buffer)) != -1) {
            int writableBytes = Math.min(readBytes, limitBytes - totalBytes);

            if (writableBytes > 0) {
                outputStream.write(buffer, 0, writableBytes);
                totalBytes += writableBytes;
            }

            if (totalBytes >= limitBytes) {
                break;
            }
        }

        return outputStream.toString(StandardCharsets.UTF_8);
    }

    private String extractOpenGraphImage(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }

        Matcher metaMatcher = META_TAG_PATTERN.matcher(html);

        while (metaMatcher.find()) {
            String metaTag = metaMatcher.group();

            if (!IMAGE_META_PATTERN.matcher(metaTag).find()) {
                continue;
            }

            Matcher contentMatcher = CONTENT_PATTERN.matcher(metaTag);

            if (contentMatcher.find()) {
                String imageUrl = contentMatcher.group(1).trim();
                return imageUrl.isBlank() ? null : imageUrl;
            }
        }

        return null;
    }

    private String normalizeImageUrl(String imageUrl, URL pageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        if (imageUrl.startsWith("//")) {
            return pageUrl.getProtocol() + ":" + imageUrl;
        }

        try {
            return new URL(pageUrl, imageUrl).toString();
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal firstDecimalValue(JsonNode node) {
        if (!node.isArray() || node.isEmpty()) {
            return null;
        }

        return node.get(0).decimalValue();
    }

    private Integer parsePrice(String price) {
        if (price == null || price.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(price);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String normalizeKeyword(String keyword, String defaultKeyword) {
        if (keyword == null || keyword.isBlank()) {
            return defaultKeyword;
        }

        return keyword.trim();
    }

    private String normalizeWebtoonWeek(String week) {
        if (week == null || week.isBlank()) {
            return currentWebtoonWeek();
        }

        String normalizedWeek = week.trim().toLowerCase(Locale.ROOT);

        return switch (normalizedWeek) {
            case "mon", "tue", "wed", "thu", "fri", "sat", "sun" -> normalizedWeek;
            default -> currentWebtoonWeek();
        };
    }

    private String currentWebtoonWeek() {
        DayOfWeek dayOfWeek = LocalDate.now(ZoneId.of("Asia/Seoul")).getDayOfWeek();

        return switch (dayOfWeek) {
            case MONDAY -> "mon";
            case TUESDAY -> "tue";
            case WEDNESDAY -> "wed";
            case THURSDAY -> "thu";
            case FRIDAY -> "fri";
            case SATURDAY -> "sat";
            case SUNDAY -> "sun";
        };
    }

    private String firstText(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            String value = node.path(fieldName).asText("");

            if (!value.isBlank()) {
                return value;
            }
        }

        return "";
    }

    private String weatherCodeToText(int weatherCode) {
        return switch (weatherCode) {
            case 0 -> "맑음";
            case 1, 2, 3 -> "구름";
            case 45, 48 -> "안개";
            case 51, 53, 55, 56, 57 -> "이슬비";
            case 61, 63, 65, 66, 67, 80, 81, 82 -> "비";
            case 71, 73, 75, 77, 85, 86 -> "눈";
            case 95, 96, 99 -> "뇌우";
            default -> "날씨 정보";
        };
    }

    private record NewsResult(List<NewsPreviewDto> news, String error) {
    }

    private record WeatherResult(WeatherPreviewDto weather, String error) {
    }

    private record ExchangeResult(ExchangeRatePreviewDto exchangeRate, String error) {
    }

    private record MarketResult(List<MarketStockPreviewDto> marketStocks, String error) {
    }

    private record ShoppingResult(List<ShoppingPreviewDto> shoppingItems, String error) {
    }

    private record WebtoonResult(List<WebtoonPreviewDto> webtoonItems, String error) {
    }

    private record StockQuery(String symbol, String name) {
    }
}
