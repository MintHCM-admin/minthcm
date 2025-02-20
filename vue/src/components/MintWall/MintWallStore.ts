import { ref, nextTick } from 'vue';
import { defineStore } from 'pinia';
import axios from 'axios';
import { useAuthStore } from '@/store/auth';

interface NewsAutor {
    id: string;
    name: string;
    photo?: string; // URL
}

interface Reaction {
    id: string;
    type: string;
    user_id: string;
    emoji: string;
}

interface NewsItem {
    id: string;
    name: string;
    publication_date: string;
    photo?: string; // URL
    author: NewsAutor;
    content_of_announcement: string;
    reactions: Reaction[];
    liked: boolean;
    selectedReactions: string[];
    reactionsCount: number;
}

export const useMintWallStore = (key = 'mint') =>
    defineStore(`wall-${key}`, () => {
        const sidebarReactions = ref<Record<string, string[]>>({});
        const wallLoading = ref(true);
        const auth = useAuthStore();
        const newsList = ref<NewsItem[]>([]);

        function getEmojiForReaction(reactionType: string) {
            return {
                like: '👍',
                love: '❤️',
                party: '🥳',
                laugh: '😆',
                wow: '😲',
            }[reactionType] || ' ';
        }


        async function loadNews() {
            wallLoading.value = true;
            newsList.value = [];
            const apiResponse = await axios.get('api/News');

            if (apiResponse.data) { 
                loadSidebarReactions(apiResponse.data); // Передаем apiResponse.data
                console.log("Pobieram reakcje z backendu", apiResponse.data);
                //await nextTick();

                newsList.value = apiResponse.data.map((newsItem: NewsItem) => {
                    /*newsItem.reactions = [...new Map(newsItem.reactions.map((r: Reaction) => [r.user_id + r.type, r])).values()];
                    newsItem.liked = newsItem.reactions.some((r) => 
                        ['like', 'love', 'party', 'laugh', 'wow'].includes(r.type) && r.user_id === auth?.user?.id
                    );*/
                    newsItem.selectedReactions = newsItem.reactions.map((r) => r.emoji);
                    newsItem.reactionsCount = newsItem.reactions.filter((r: Reaction) => r && r.id).length;//Liczymy tylko reakcje, które NIE są null
                    return newsItem;
                });
            }

            wallLoading.value = false;
        }

        function getReactionIndex(newsItem: NewsItem, reactionType: string) {
            return newsItem.reactions.findIndex((x) => x.type === reactionType && x.user_id === auth?.user?.id);
        }

        async function addReaction(newsItem: NewsItem, reactionType: string, action: 'add' | 'delete') {
            console.log(`addReaction() was called with newsId: ${newsItem.id} and reactionType: ${reactionType}`);
        
            if (!newsItem || !newsItem.id) {
                console.error("Error: newsItem or newsItem.id is undefined!");
                return;
            }
        
            const userId = auth?.user?.id;
            if (!userId) {
                console.error("Error: User ID is undefined!");
                return;
            }
        
            // Проверяем, если реакция уже есть
    const reactionIndex = newsItem.selectedReactions.indexOf(reactionType);
    if (reactionIndex === -1 && action === 'add') {
        // Если реакции нет и действие "add", добавляем
        newsItem.selectedReactions.push(reactionType);
    } else if (reactionIndex !== -1 && action === 'delete') {
        // Если реакция есть и действие "delete", удаляем
        newsItem.selectedReactions.splice(reactionIndex, 1);
    }

    // Обновляем количество реакций
    newsItem.reactionsCount = newsItem.selectedReactions.length;

    // Отправляем запрос на добавление или удаление реакции на сервер
    const url = action === 'add' ? 'api/Reactions/Create' : `api/Reactions/${newsItem.reactions[getReactionIndex(newsItem, reactionType)]?.id}`;
    try {
        const response = await axios[action === 'add' ? 'post' : 'delete'](url, action === 'add' ? {
            record_data: {
                parent_type: 'News',
                parent_id: newsItem.id,
                assigned_user_id: userId,
                reaction_type: reactionType,
            },
        } : undefined);

        if (response?.data?.id) {
            console.log("Reaction added successfully:", response.data);

            if (action === 'add') {
                // Добавляем реакцию, если добавляем
                const newReaction = {
                    id: response.data.id,
                    type: response.data.reaction_type.toLowerCase(),
                    user_id: response.data.assigned_user_id,
                    emoji: getEmojiForReaction(response.data.reaction_type),
                };
                newsItem.reactions.push(newReaction);
            }

            // Обновляем боковую панель
            sidebarReactions.value[newsItem.id] = newsItem.reactions.map((r) => r.emoji);
        } else if (action === 'delete') {
            // Удаляем реакцию, если удаляем
            const reactionIndex = getReactionIndex(newsItem, reactionType);
            if (reactionIndex !== -1) {
                newsItem.reactions.splice(reactionIndex, 1);
            }
            sidebarReactions.value[newsItem.id] = newsItem.reactions.map((r) => r.emoji);
        }

        console.log("Calling saveSidebarReactions() from addReaction()");
        saveSidebarReactions();

        // Обновляем статус "like"
        newsItem.liked = newsItem.reactions.some((r) => r.user_id === userId);
    } catch (error) {
        console.error("Error while adding/deleting reaction:", error);
    }
        }
        

        function likeClicked(newsId: string) {
            
const news = newsList.value.find((n) => n.id === newsId);
            if (news) {
                news.liked ? addReaction(news, 'like', 'delete') : addReaction(news, 'like', 'add');
                news.liked = !news.liked;
            }
        }

        function saveSidebarReactions() {
        localStorage.setItem("sidebarReactions", JSON.stringify(sidebarReactions));

        }

        async function loadSidebarReactions(newsId: string) {
            console.log("newsId being sent:", newsId);

            console.log("Loading reactions from DB...");
        
            // try {
            //     //const response = await fetch(`/api/custom/NewsApi/getReactions?news_id=${newsId}`);
            //     const response = await axios.get(`api/NewsApi/getReactions?news_id=${newsId}`);
            //     const data = response.data;
        
            //     if (data.success) {
            //         console.log("Loaded reactions from DB:", data.reactions);
            //         sidebarReactions.value = data.reactions;
            //     } else {
            //         console.error("Error loading reactions:", data.message);
            //     }
            // } catch (error) {
            //     console.error("Error:", error);
            // }
        }
        

        return {
            wallLoading,
            newsList,
            loadNews,
            likeClicked,
            sidebarReactions,
            addReaction,
        };
    })();
