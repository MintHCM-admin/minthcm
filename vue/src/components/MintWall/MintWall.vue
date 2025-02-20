<template>
    <div class="mint-news-container">
        <div v-if="wall.wallLoading">
            <v-skeleton-loader
                v-for="index in 3"
                :key="'mint-news-wall-loader' + index"
                type="article"
                class="mint-news-loading"
            />
        </div>
        <v-row v-else no-gutters class="mint-news-row">
            <template v-for="newsItem in wall.newsList" :key="newsItem.id">
                <div class="mint-news-card">
                    <div class="mint-news-header">
                        <img
                            v-if="newsItem.author.photo"
                            class="mint-news-avatar"
                            alt="News author photo"
                            :src="newsItem.author.photo"
                            @click="navigateTo(`/modules/Employees/DetailView/${newsItem.author.id}`)"
                        />
                        <v-icon
                            v-else
                            class="mint-news-avatar"
                            size="40"
                            icon="mdi-account"
                            @click="navigateTo(`/modules/Employees/DetailView/${newsItem.author.id}`)"
                        />
                        <div class="mint-news-subheader">
                            <div
                                class="mint-news-author"
                                @click="navigateTo(`/modules/Employees/DetailView/${newsItem.author.id}`)"
                            >
                                {{ newsItem.author.name }}
                            </div>
                            <div class="mint-news-time">{{ toRelativeDate(newsItem.publication_date) }}</div>
                        </div>
                    </div>

                    <img
                        v-if="newsItem.photo"
                        class="mint-news-img"
                        alt="News image"
                        :src="newsItem.photo"
                        @click="navigateTo(`/modules/News/DetailView/${newsItem.id}`)"
                    />

                    <h5 class="mint-news-title" @click="navigateTo(`/modules/News/DetailView/${newsItem.id}`)">
                        {{ newsItem.name }}
                    </h5>
                    <div class="mint-news-desc">{{ normalizeNewsContent(newsItem.content_of_announcement) }}</div>

                    <div class="divider"></div>

                    <div style="height:10px;"></div>
                    <div style="background-color: #eff1f1; height:3px;"></div>
                    <div class="empty-space">
                        <!-- reactions panel 
                        <div v-if="sidebarReactions[newsItem.id]" class="reaction-strip">
                            <span v-for="(emoji, index) in sidebarReactions[newsItem.id]" :key="index">
                                {{ emoji }}
                            </span>
                            <span v-if="newsItem.reactionsCount > 0" class="reaction-count" style="margin-left: 10px; color:#145d7b; font-weight: bold;">
                                {{ newsItem.reactionsCount }}
                            </span>
                        </div>-->


                        <div v-if="newsItem.selectedReactions" class="reaction-strip">
                            <span v-for="(emoji, index) in newsItem.selectedReactions" :key="index">
                                {{ emoji }}
                            </span>
                            <span v-if="newsItem.reactionsCount > 0" class="reaction-count" style="margin-left: 10px; color:#145d7b; font-weight: bold;">
                                {{ newsItem.reactionsCount }}
                            </span>
                        </div>


                        <div v-if="newsItem.selectedReactions" class="reaction-strip">
                            <span v-for="r in newsItem.selectedReactions" :key="r">
                                {{ reactions.find(reaction => reaction.type === r)?.emoji }}
                            </span>
                            <span v-if="newsItem.reactionsCount > 0" class="reaction-count" style="margin-left: 10px; color:#145d7b; font-weight: bold;">
                                {{ newsItem.reactionsCount }}
                            </span>
                        </div>
                        <!--
                        <div class="reaction-summary">
                            <span v-for="r in newsItem.selectedReactions" :key="r">
                                {{ reactions.find(reaction => reaction.type === r)?.emoji }}
                            </span>
                            <span v-if="newsItem.reactionsCount > 0" class="reaction-count" style="margin-left: 10px; color:#145d7b; font-weight: bold;">
                                {{ newsItem.reactionsCount }}
                            </span>
                        </div>-->
                    </div>

                    <div class="divider"></div>
                    <div style="height:5px;"></div>
                    <div style="background-color: #eff1f1; height:3px;"></div>

                    <div class="mint-news-footer">
                        <!-- like -->
                        <MintButton
                            :variant="newsItem.liked ? 'regular' : 'text'"
                            :text="newsItem.liked ? 'LIKED' : 'LIKE'"
                            :active="newsItem.liked"
                            icon="mdi-thumb-up"
                            @mouseover="activeReactionPanel = newsItem.id"
                            @click="toggleLike(newsItem.id)"
                        />
                        <div class="mint-news-read-more" @click="navigateTo(`/modules/News/DetailView/${newsItem.id}`)">
                            {{ languages.label('LBL_MINT4_WALL_READ_MORE') }}
                        </div>
                    </div>

                    <!-- reactions container -->
                    <div class="reaction-container">
                        <div 
                            class="reaction-panel"  
                            v-if="activeReactionPanel === newsItem.id"
                            @mouseleave="activeReactionPanel = null"
                        >
                            <span v-for="reaction in reactions" :key="reaction.type" 
                                @click="addReaction(newsItem.id, reaction.type); console.log('Clicked on reaction:', newsItem.id, reaction.type);">
                                {{ reaction.emoji }}
                            </span>
                        </div>
                    </div>
                </div>
            </template>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { DateTime } from 'luxon';
import { useRouter } from 'vue-router';
import { useLanguagesStore } from '@/store/languages';
import { useMintWallStore } from './MintWallStore';
import { useUxStore } from '@/store/ux';
import MintButton from '@/components/MintButtons/MintButton.vue';

const router = useRouter();
const languages = useLanguagesStore();
const wall = useMintWallStore();
const ux = useUxStore();
wall.loadNews();

// Lista dostępnych reakcji
const reactions = ref([
    { type: "like", emoji: "👍" },
    { type: "love", emoji: "❤️" },
    { type: "party", emoji: "🥳" },
    { type: "laugh", emoji: "😆" },
    { type: "wow", emoji: "😲" }
]);

// Stan aktywnego panelu reakcji
const activeReactionPanel = ref<string | null>(null);
const sidebarReactions = computed(() => wall.sidebarReactions);


const toRelativeDate = (date: string) => {
    const dt = DateTime.fromSQL(date, { zone: 'UTC' });
    return dt.diffNow('days').days >= -5 ? dt.toRelative() : dt.toFormat('dd.MM.yyyy');
};

const normalizeNewsContent = (html: string) => 
    html.replace(/<\/?[^>]+(>|$)/g, '').slice(0, 250) + (html.length > 250 ? '...' : '');

// Dodawanie reakcji
const addReaction = (newsId: string, reactionType: string) => {
    const newsItem = wall.newsList.find(news => news.id === newsId);
    if (!newsItem) return;

    // Если реакция уже добавлена, удаляем её
    if (newsItem.selectedReactions.includes(reactionType)) {
        console.log(`Removing reaction: ${reactionType} from newsId: ${newsId}`);
        newsItem.selectedReactions = newsItem.selectedReactions.filter(r => r !== reactionType);
        newsItem.reactionsCount = newsItem.selectedReactions.length;
        wall.addReaction(newsItem, reactionType, "delete"); // Удаляем реакцию
    } else {
        console.log(`Adding reaction: ${reactionType} to newsId: ${newsId}`);
        // Если реакция ещё не добавлена, добавляем её
        newsItem.selectedReactions.push(reactionType);
        newsItem.reactionsCount = newsItem.selectedReactions.length;
        wall.addReaction(newsItem, reactionType, "add"); // Добавляем реакцию
    }
    console.log('Updated selected reactions:', newsItem.selectedReactions);
    activeReactionPanel.value = null; // Закрываем панель реакции
};

// Funkcja obsługująca kliknięcie "Like"
const toggleLike = (newsId: string) => {
    const newsItem = wall.newsList.find(news => news.id === newsId);
    if (!newsItem) return;

    newsItem.liked = !newsItem.liked;
    newsItem.liked ? addReaction(newsId, 'like') : 
        (newsItem.selectedReactions = newsItem.selectedReactions.filter(r => r !== 'like'));

    newsItem.reactionsCount = newsItem.selectedReactions.length;
};

const navigateTo = (url: string) => {
    router.push(url);
    ux.drawer = null;
};

console.log("Reactions data:", reactions);
console.log("Reactions data (debug):", JSON.stringify(reactions, null, 2));


</script>


<style scoped lang="scss">
.mint-news-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    font-family: 'Barlow', sans-serif;
    overflow: scroll;
    scroll-behavior: smooth;
    height: 100%;
    padding-top: 8px;
    .mint-news-loading {
        top: 20px;
    }
    .mint-news-row {
        display: flex;
        flex-direction: column;
        background: #f5fbfa 0% 0% no-repeat padding-box;
        border-radius: 16px;
        margin: 8px 16px;
        padding: 12px;
        color: #000000de;
        .mint-news-header {
            display: flex;
            flex-direction: row;
            width: 100%;
            max-height: 40px;
            margin-bottom: 16px;
            .mint-news-avatar {
                object-fit: cover;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
            }
            .mint-news-subheader {
                display: flex;
                flex-direction: row;
                align-items: center;
                width: 100%;
                justify-content: space-between;
                .mint-news-author {
                    letter-spacing: 0.43px;
                    color: rgb(var(--v-theme-secondary));
                    font-weight: 600; // SemiBold
                    font-size: 14px;
                    margin-left: 16px;
                    cursor: pointer;
                }
                .mint-news-time {
                    letter-spacing: 0.4px;
                    color: rgb(var(--v-theme-primary));
                    font-weight: 600; // SemiBold
                    font-size: 12px;
                    text-align: right;
                    margin-right: 28px;
                }
            }
        }
        .mint-news-img {
            width: 100%;
            min-height: 80px;
            max-height: 200px;
            border-radius: 16px;
            object-fit: cover;
            margin-bottom: 16px;
            cursor: pointer;
        }
        .mint-news-title {
            font-size: 24px;
            letter-spacing: 0.18px;
            margin-bottom: 16px;
            cursor: pointer;
        }
        .mint-news-desc {
            letter-spacing: 0.18px;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .mint-news-footer {
            margin: 16px 8px 8px 8px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            color: rgb(var(--v-theme-secondary));
            .mint-news-like {
                font-weight: 600; // SemiBold
                color: rgb(var(--v-theme-secondary));
                background-color: rgb(var(--v-theme-primary-lighter));
            }
            .mint-news-read-more {
                text-decoration: underline;
                cursor: pointer;
            }
        }

.reaction-container {
    position: relative;
    display: flex;
    align-items: center;
}

.reaction-panel {
    position: absolute;
    bottom: 50px;
    left: 7px;
    background: white;
    padding: 8px;
    border-radius: 50px;
    display: flex;
    gap: 6px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.reaction-panel span {
    cursor: pointer;
    font-size: 18px;
    transition: transform 0.2s ease;
    border-radius: 50%;
}
.reaction-panel span:hover {
    transform: scale(1.1);
    //background-color: #145d7b;
    border-radius: 50%;
}

.reaction-summary {
    display: flex;
    align-items: left;
    gap: 1px;
    margin-right: 0px;
    margin-left: 5px;
    margin-top: 5px;
}
.empty-space{
    justify-content: left; 
    align-items: center;
    display:flex;
    height:40px;
}


    }
}
</style>
