/* Local HSK 1–3 word list for the Mandarin word of the day. Rotates by date. */
'use strict';
const HSK_WORDS = [
  ['爱', 'ài', 'to love', 1], ['爸爸', 'bàba', 'dad', 1], ['杯子', 'bēizi', 'cup, glass', 1], ['北京', 'Běijīng', 'Beijing', 1],
  ['不客气', 'bú kèqi', "you're welcome", 1], ['菜', 'cài', 'dish, vegetable', 1], ['茶', 'chá', 'tea', 1], ['吃', 'chī', 'to eat', 1],
  ['出租车', 'chūzūchē', 'taxi', 1], ['打电话', 'dǎ diànhuà', 'to make a phone call', 1], ['电脑', 'diànnǎo', 'computer', 1], ['电影', 'diànyǐng', 'movie', 1],
  ['东西', 'dōngxi', 'thing, stuff', 1], ['对不起', 'duìbuqǐ', 'sorry', 1], ['多少', 'duōshao', 'how many, how much', 1], ['飞机', 'fēijī', 'airplane', 1],
  ['分钟', 'fēnzhōng', 'minute', 1], ['高兴', 'gāoxìng', 'happy, glad', 1], ['工作', 'gōngzuò', 'work, job', 1], ['汉语', 'Hànyǔ', 'Chinese (language)', 1],
  ['喝', 'hē', 'to drink', 1], ['回', 'huí', 'to return', 1], ['会', 'huì', 'can, know how to', 1], ['火车站', 'huǒchēzhàn', 'train station', 1],
  ['家', 'jiā', 'home, family', 1], ['今天', 'jīntiān', 'today', 1], ['看见', 'kànjiàn', 'to see', 1], ['老师', 'lǎoshī', 'teacher', 1],
  ['冷', 'lěng', 'cold', 1], ['买', 'mǎi', 'to buy', 1], ['米饭', 'mǐfàn', 'cooked rice', 1], ['明天', 'míngtiān', 'tomorrow', 1],
  ['名字', 'míngzi', 'name', 1], ['朋友', 'péngyou', 'friend', 1], ['漂亮', 'piàoliang', 'pretty, beautiful', 1], ['苹果', 'píngguǒ', 'apple', 1],
  ['钱', 'qián', 'money', 1], ['热', 'rè', 'hot', 1], ['认识', 'rènshi', 'to know (a person)', 1], ['商店', 'shāngdiàn', 'shop, store', 1],
  ['睡觉', 'shuìjiào', 'to sleep', 1], ['水', 'shuǐ', 'water', 1], ['天气', 'tiānqì', 'weather', 1], ['喜欢', 'xǐhuan', 'to like', 1],
  ['学习', 'xuéxí', 'to study, to learn', 1], ['医生', 'yīshēng', 'doctor', 1], ['月', 'yuè', 'month, moon', 1], ['中国', 'Zhōngguó', 'China', 1],
  ['跑步', 'pǎobù', 'to run, jog', 2], ['运动', 'yùndòng', 'sport, exercise', 2], ['身体', 'shēntǐ', 'body, health', 2], ['早上', 'zǎoshang', 'early morning', 2],
  ['晚上', 'wǎnshang', 'evening', 2], ['时间', 'shíjiān', 'time', 2], ['生日', 'shēngrì', 'birthday', 2], ['鸡蛋', 'jīdàn', 'egg', 2],
  ['牛奶', 'niúnǎi', 'milk', 2], ['鱼', 'yú', 'fish', 2], ['快乐', 'kuàilè', 'happy, joyful', 2], ['准备', 'zhǔnbèi', 'to prepare', 2],
  ['第一', 'dì-yī', 'first', 2], ['休息', 'xiūxi', 'to rest', 2], ['眼睛', 'yǎnjing', 'eye', 2], ['希望', 'xīwàng', 'to hope; hope', 2],
  ['太阳', 'tàiyáng', 'sun', 3], ['月亮', 'yuèliang', 'moon', 3], ['锻炼', 'duànliàn', 'to work out, exercise', 3], ['健康', 'jiànkāng', 'healthy, health', 3],
  ['努力', 'nǔlì', 'to work hard', 3], ['习惯', 'xíguàn', 'habit; to be used to', 3], ['记得', 'jìde', 'to remember', 3], ['简单', 'jiǎndān', 'simple', 3],
  ['安静', 'ānjìng', 'quiet, calm', 3], ['历史', 'lìshǐ', 'history', 3], ['世界', 'shìjiè', 'world', 3], ['环境', 'huánjìng', 'environment', 3],
  ['机会', 'jīhuì', 'opportunity, chance', 3], ['一直', 'yìzhí', 'always, all along', 3], ['认真', 'rènzhēn', 'serious, conscientious', 3], ['满意', 'mǎnyì', 'satisfied', 3],
];
