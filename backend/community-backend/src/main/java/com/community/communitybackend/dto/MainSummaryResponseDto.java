package com.community.communitybackend.dto;

import com.community.communitybackend.entity.Post;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;

@Getter
public class MainSummaryResponseDto {

    private final List<PostPreviewDto> posts;
    private final List<NewsPreviewDto> news;
    private final WeatherPreviewDto weather;
    private final ExchangeRatePreviewDto exchangeRate;
    private final List<MarketStockPreviewDto> marketStocks;
    private final List<ShoppingPreviewDto> shoppingItems;
    private final List<WebtoonPreviewDto> webtoonItems;
    private final String newsError;
    private final String weatherError;
    private final String exchangeError;
    private final String marketError;
    private final String shoppingError;
    private final String webtoonError;

    public MainSummaryResponseDto(
            List<PostPreviewDto> posts,
            List<NewsPreviewDto> news,
            WeatherPreviewDto weather,
            ExchangeRatePreviewDto exchangeRate,
            List<MarketStockPreviewDto> marketStocks,
            List<ShoppingPreviewDto> shoppingItems,
            List<WebtoonPreviewDto> webtoonItems,
            String newsError,
            String weatherError,
            String exchangeError,
            String marketError,
            String shoppingError,
            String webtoonError
    ) {
        this.posts = posts;
        this.news = news;
        this.weather = weather;
        this.exchangeRate = exchangeRate;
        this.marketStocks = marketStocks;
        this.shoppingItems = shoppingItems;
        this.webtoonItems = webtoonItems;
        this.newsError = newsError;
        this.weatherError = weatherError;
        this.exchangeError = exchangeError;
        this.marketError = marketError;
        this.shoppingError = shoppingError;
        this.webtoonError = webtoonError;
    }

    @Getter
    public static class PostPreviewDto {
        private final Long id;
        private final String boardName;
        private final String username;
        private final String nickname;
        private final String title;
        private final Integer viewCount;
        private final Integer commentCount;
        private final LocalDateTime createdAt;

        public PostPreviewDto(Post post) {
            this.id = post.getId();
            this.boardName = post.getBoard().getName();
            this.username = post.getUser().getUsername();
            this.nickname = post.getUser().getNickname();
            this.title = post.getTitle();
            this.viewCount = post.getViewCount();
            this.commentCount = post.getCommentCount();
            this.createdAt = post.getCreatedAt();
        }
    }

    @Getter
    public static class NewsPreviewDto {
        private final String title;
        private final String link;
        private final String description;
        private final String pubDate;
        private final String originallink;
        private final String imageUrl;

        public NewsPreviewDto(
                String title,
                String link,
                String description,
                String pubDate,
                String originallink,
                String imageUrl
        ) {
            this.title = title;
            this.link = link;
            this.description = description;
            this.pubDate = pubDate;
            this.originallink = originallink;
            this.imageUrl = imageUrl;
        }
    }

    @Getter
    public static class WeatherPreviewDto {
        private final String location;
        private final BigDecimal temperature;
        private final BigDecimal highTemperature;
        private final BigDecimal lowTemperature;
        private final Integer humidity;
        private final BigDecimal windSpeed;
        private final String weatherText;
        private final String updatedAt;

        public WeatherPreviewDto(
                String location,
                BigDecimal temperature,
                BigDecimal highTemperature,
                BigDecimal lowTemperature,
                Integer humidity,
                BigDecimal windSpeed,
                String weatherText,
                String updatedAt
        ) {
            this.location = location;
            this.temperature = temperature;
            this.highTemperature = highTemperature;
            this.lowTemperature = lowTemperature;
            this.humidity = humidity;
            this.windSpeed = windSpeed;
            this.weatherText = weatherText;
            this.updatedAt = updatedAt;
        }
    }

    @Getter
    public static class ExchangeRatePreviewDto {
        private final String baseCurrency;
        private final String targetCurrency;
        private final BigDecimal rate;
        private final String date;

        public ExchangeRatePreviewDto(
                String baseCurrency,
                String targetCurrency,
                BigDecimal rate,
                String date
        ) {
            this.baseCurrency = baseCurrency;
            this.targetCurrency = targetCurrency;
            this.rate = rate;
            this.date = date;
        }
    }

    @Getter
    public static class ShoppingPreviewDto {
        private final String title;
        private final String link;
        private final String imageUrl;
        private final Integer price;
        private final String mallName;

        public ShoppingPreviewDto(
                String title,
                String link,
                String imageUrl,
                Integer price,
                String mallName
        ) {
            this.title = title;
            this.link = link;
            this.imageUrl = imageUrl;
            this.price = price;
            this.mallName = mallName;
        }
    }

    @Getter
    public static class MarketStockPreviewDto {
        private final String symbol;
        private final String name;
        private final BigDecimal price;
        private final BigDecimal change;
        private final BigDecimal changePercent;
        private final String currency;

        public MarketStockPreviewDto(
                String symbol,
                String name,
                BigDecimal price,
                BigDecimal change,
                BigDecimal changePercent,
                String currency
        ) {
            this.symbol = symbol;
            this.name = name;
            this.price = price;
            this.change = change;
            this.changePercent = changePercent;
            this.currency = currency;
        }
    }

    @Getter
    public static class WebtoonPreviewDto {
        private final String title;
        private final String link;
        private final String imageUrl;

        public WebtoonPreviewDto(String title, String link, String imageUrl) {
            this.title = title;
            this.link = link;
            this.imageUrl = imageUrl;
        }
    }
}
