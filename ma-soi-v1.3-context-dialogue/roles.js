// roles.js - Định nghĩa toàn bộ 36 loại vai trong Game Ma Sói (Werewolf Game)

export const ROLES = {
  // ==========================================
  // 7.1. PHE SÓI — 10 LOẠI
  // ==========================================
  WEREWOLF: {
    id: 'WEREWOLF',
    name: 'Sói Thường',
    enName: 'Werewolf',
    team: 'werewolf',
    category: 'Sói',
    color: '#e63946',
    icon: '🐺',
    badge: 'Sói',
    shortDesc: 'Cắn chung theo phiếu đàn Sói mỗi đêm; hòa thì không cắn.',
    fullDesc: 'Thuộc đàn Sói, thức giấc mỗi đêm cùng bầy sói để thống nhất chọn ra một nạn nhân để cắn chết. Nếu đàn sói hòa phiếu hoặc không thống nhất được mục tiêu, đêm đó sẽ không cắn ai.',
    nightPriority: 60,
    hasNightAction: true,
    actionType: 'wolf_kill',
    tips: 'Nên ngụy trang thành Dân thường hoặc vai Dân có thông tin mờ. Không nên đồng loạt vote cùng một người một cách lộ liễu vào ban ngày.'
  },

  ALPHA_WOLF: {
    id: 'ALPHA_WOLF',
    name: 'Sói Trùm / Sói Chúa',
    enName: 'Alpha Wolf',
    team: 'werewolf',
    category: 'Sói',
    color: '#d62828',
    icon: '👑🐺',
    badge: 'Chúa Sói',
    shortDesc: 'Một lần trong ván có thể chọn chuyển nạn nhân thành Sói thay vì cắn chết.',
    fullDesc: 'Lãnh tụ tối cao của đàn Sói. Có 1 cơ hội duy nhất trong game: Khi đàn Sói cắn trúng một người, Sói Trùm có thể kích hoạt quyền năng Nhiễm Hóa để biến nạn nhân thành một con Sói mới thay vì giết chết (nếu nạn nhân được Phù Thủy hoặc Bảo Vệ cứu, việc nhiễm hóa thất bại).',
    nightPriority: 59,
    hasNightAction: true,
    actionType: 'alpha_infect',
    tips: 'Hãy để dành quyền nhiễm hóa để đồng hóa một Dân làng có vai trò quan trọng hoặc người đang được dân làng tin tưởng tuyệt đối.'
  },

  FROST_WOLF: {
    id: 'FROST_WOLF',
    name: 'Sói Băng Giá',
    enName: 'Frost Wolf',
    team: 'werewolf',
    category: 'Sói',
    color: '#00b4d8',
    icon: '❄️🐺',
    badge: 'Băng Sói',
    shortDesc: 'Đóng băng mục tiêu, ảnh hưởng kỹ năng đêm hoặc quyền bỏ phiếu.',
    fullDesc: 'Cắn cùng đàn sói. Ngoài ra mỗi đêm có thể chọn 1 người chơi để Đóng Băng. Nạn nhân bị đóng băng sẽ bị câm lặng: mất kỹ năng đêm trong đêm đó và ban ngày phiếu biểu quyết của họ không có giá trị.',
    nightPriority: 25,
    hasNightAction: true,
    actionType: 'frost_freeze',
    tips: 'Đóng băng người chơi bạn nghi là Tiên Tri, Bảo Vệ hoặc Thị Trưởng để tước đi quyền năng của họ trong thời khắc quyết định.'
  },

  WOLF_SORCERER: {
    id: 'WOLF_SORCERER',
    name: 'Sói Phù Thủy',
    enName: 'Wolf Sorcerer',
    team: 'werewolf',
    category: 'Sói',
    color: '#7209b7',
    icon: '🔮🐺',
    badge: 'Phù Thủy Sói',
    shortDesc: 'Một lần dùng phép biến đổi hoặc giết người trong đêm.',
    fullDesc: 'Có một bình tà thuật bóng tối duy nhất trong trận. Có thể dùng trong đêm độc lập với đàn Sói để hạ sát ngay một người chơi bất kỳ xuyên qua lớp bảo vệ thông thường, hoặc nguyền rủa làm đảo lộn danh tính người đó khi bị soi.',
    nightPriority: 62,
    hasNightAction: true,
    actionType: 'wolf_sorcerer_kill',
    tips: 'Dùng đòn kết liễu này vào ban đêm khi đàn sói cần hạ gục nhanh chóng Bảo Vệ hoặc một Dân làng chủ chốt.'
  },

  WOLF_CUB: {
    id: 'WOLF_CUB',
    name: 'Sói Con',
    enName: 'Wolf Cub',
    team: 'werewolf',
    category: 'Sói',
    color: '#f77f00',
    icon: '🐾🐺',
    badge: 'Sói Con',
    shortDesc: 'Bị xử tử ban ngày thì đàn Sói có đòn cắn bổ sung đêm kế.',
    fullDesc: 'Đứa con cưng của bầy Sói. Thức dậy và cắn cùng bầy Sói. Nếu Sói Con bị dân làng bỏ phiếu treo cổ vào ban ngày, nỗi thịnh nộ sẽ khiến đàn Sói được cắn 2 nạn nhân vào đêm kế tiếp!',
    nightPriority: 60,
    hasNightAction: true,
    actionType: 'wolf_kill',
    tips: 'Nếu tình thế nguy cấp, bạn có thể hi sinh làm mồi nhử để đàn Sói phục thù với 2 mạng vào đêm hôm sau.'
  },

  WHITE_WEREWOLF: {
    id: 'WHITE_WEREWOLF',
    name: 'Sói Trắng',
    enName: 'White Werewolf',
    team: 'werewolf', // Thuộc đàn sói nhưng có mục tiêu riêng
    category: 'Sói / Độc lập',
    color: '#e0e1dd',
    icon: '⚪🐺',
    badge: 'Sói Trắng',
    shortDesc: 'Tham gia đàn Sói nhưng có đòn giết Sói riêng định kỳ; mục tiêu sống sót cuối.',
    fullDesc: 'Ngụy trang trong bầy Sói và cắn cùng họ mỗi đêm. Cứ mỗi 2 đêm (đêm chẵn: Đêm 2, Đêm 4...), Sói Trắng thức giấc riêng một mình và có thể chọn cắn chết một con Sói khác trong đàn. Mục tiêu tối thượng của Sói Trắng là trở thành người sống sót duy nhất trong làng!',
    nightPriority: 65,
    hasNightAction: true,
    actionType: 'white_wolf_kill',
    tips: 'Đầu game hãy hợp tác cùng bầy sói tiêu diệt dân làng, sau đó bắt đầu thanh trừng nội bộ từng con sói đồng đội.'
  },

  NIGHTMARE_WOLF: {
    id: 'NIGHTMARE_WOLF',
    name: 'Sói Ác Mộng',
    enName: 'Nightmare Wolf',
    team: 'werewolf',
    category: 'Sói',
    color: '#3a0ca3',
    icon: '🌑🐺',
    badge: 'Ác Mộng Sói',
    shortDesc: 'Gieo ác mộng lên 1 người: người đó rơi vào mê muội, mất năng lực đêm.',
    fullDesc: 'Gieo rắc cơn ác mộng kinh hoàng lên tâm trí một người chơi mỗi đêm. Người chịu ác mộng sẽ rơi vào giấc ngủ say tê liệt, mọi hành động và kỹ năng đêm của người đó đều bị vô hiệu hóa hoàn toàn.',
    nightPriority: 20,
    hasNightAction: true,
    actionType: 'nightmare_curse',
    tips: 'Kích hoạt lên các vai chủ lực như Tiên Tri hoặc Phù Thủy ngay từ đầu đêm để phá hỏng kế hoạch soi/cứu của họ.'
  },

  ILLUSION_WOLF: {
    id: 'ILLUSION_WOLF',
    name: 'Sói Ảo Ảnh',
    enName: 'Illusion Wolf',
    team: 'werewolf',
    category: 'Sói',
    color: '#9d4edd',
    icon: '🌫️🐺',
    badge: 'Ảo Ảnh Sói',
    shortDesc: 'Tạo ảo ảnh ngụy trang phe cho đồng đội hoặc bản thân trước mắt Tiên Tri.',
    fullDesc: 'Mỗi đêm có thể phù phép tạo ảo ảnh lên bản thân hoặc 1 con Sói đồng minh. Nếu mục tiêu được che phủ bị Tiên Tri, Thám Tử hay Cáo soi trong đêm đó, kết quả trả về sẽ hiển thị là "Phe Dân Làng" thuần khiết.',
    nightPriority: 22,
    hasNightAction: true,
    actionType: 'illusion_cast',
    tips: 'Dùng ảo ảnh bảo bọc cho Sói đang bị nghi ngờ nhiều nhất để đánh lừa Tiên Tri ban ngày.'
  },

  PLAGUE_WOLF: {
    id: 'PLAGUE_WOLF',
    name: 'Sói Dịch Bệnh',
    enName: 'Plague Wolf',
    team: 'werewolf',
    category: 'Sói',
    color: '#588157',
    icon: '☣️🐺',
    badge: 'Dịch Bệnh Sói',
    shortDesc: 'Gây bệnh; hiệu lực bệnh bắt đầu cuối đêm bị lây và giết nạn nhân sau 1 ngày.',
    fullDesc: 'Bên cạnh đòn cắn thông thường, Sói Dịch Bệnh có thể truyền mầm bệnh chết chóc vào một nạn nhân. Mầm bệnh ủ trong cơ thể, nạn nhân sẽ qua đời vào cuối ngày tiếp theo trừ khi được Bác Sĩ hoặc Nhà Giả Kim chữa khỏi.',
    nightPriority: 61,
    hasNightAction: true,
    actionType: 'plague_infect',
    tips: 'Rải mầm bệnh lên những người chơi uy tín mà đàn sói chưa kịp cắn trực tiếp.'
  },

  DISGUISED_WOLF: {
    id: 'DISGUISED_WOLF',
    name: 'Sói Ngụy Trang',
    enName: 'Disguised Wolf',
    team: 'werewolf',
    category: 'Sói',
    color: '#6c757d',
    icon: '🎭🐺',
    badge: 'Sói Ngụy Trang',
    shortDesc: 'Bậc thầy trà trộn, khi chết hoặc bị điều tra hiển thị danh phận như Dân Thường.',
    fullDesc: 'Cắn cùng đàn Sói. Nhờ khả năng ngụy trang bậc thầy, ngay cả khi bị treo cổ hay chết đêm, danh tính được công bố cho làng vẫn hiển thị là "Dân Thường", khiến dân làng rơi vào hoang mang và phán đoán sai lầm về số lượng Sói còn sống.',
    nightPriority: 60,
    hasNightAction: true,
    actionType: 'wolf_kill',
    tips: 'Hãy chơi cực kỳ táo bạo như một Dân làng gương mẫu để chia rẽ niềm tin của dân làng.'
  },

  // ==========================================
  // 7.2. PHE DÂN LÀNG — 20 LOẠI
  // ==========================================
  SEER: {
    id: 'SEER',
    name: 'Tiên Tri',
    enName: 'Seer',
    team: 'villager',
    category: 'Dân Làng',
    color: '#4cc9f0',
    icon: '🔮👁️',
    badge: 'Tiên Tri',
    shortDesc: 'Soi một người mỗi đêm, nhận phe hiện tại của mục tiêu.',
    fullDesc: 'Nhân vật cốt cán của phe Dân. Thức dậy mỗi đêm, chọn 1 người chơi còn sống để xem người đó thuộc Phe Dân Làng, Phe Sói hay Phe Độc Lập.',
    nightPriority: 70,
    hasNightAction: true,
    actionType: 'seer_check',
    tips: 'Hãy ghi chép cẩn thận thông tin soi mỗi đêm. Lộ mặt vào thời điểm có ít nhất 1-2 manh mối Sói vững chắc và khi có Bảo Vệ che chắn.'
  },

  APPRENTICE_SEER: {
    id: 'APPRENTICE_SEER',
    name: 'Tiên Tri Tập Sự',
    enName: 'Apprentice Seer',
    team: 'villager',
    category: 'Dân Làng',
    color: '#70e000',
    icon: '📜👁️',
    badge: 'Tập Sự',
    shortDesc: 'Kế thừa chức năng soi khi Tiên Tri chính qua đời.',
    fullDesc: 'Ban đầu chỉ là một Dân làng bình thường không có kỹ năng đêm. Tuy nhiên ngay khi Tiên Tri chính hy sinh, Tiên Tri Tập Sự sẽ thức tỉnh và thừa kế toàn bộ khả năng soi của Tiên Tri từ đêm tiếp theo.',
    nightPriority: 71,
    hasNightAction: false, // kích hoạt khi Seer chết
    actionType: 'apprentice_wake',
    tips: 'Giấu mình thật kỹ đầu game, khuyến khích Tiên Tri chính để lại di ngôn hoặc thông tin soi trước khi ngã xuống.'
  },

  FOX: {
    id: 'FOX',
    name: 'Cáo',
    enName: 'Fox',
    team: 'villager',
    category: 'Dân Làng',
    color: '#f3722c',
    icon: '🦊',
    badge: 'Cáo',
    shortDesc: 'Soi nhóm ba người ngồi cạnh; nếu không có Sói thì mất kỹ năng.',
    fullDesc: 'Mỗi đêm chọn một người chơi làm tâm điểm để kiểm tra cụm 3 người (người đó và 2 người ngồi liền kề bên trái và phải). Nếu trong 3 người có ít nhất 1 Sói, Cáo nhận tín hiệu "Có Sói" và giữ nguyên năng lực. Nếu cả 3 đều trong sạch, Cáo mất kỹ năng vĩnh viễn!',
    nightPriority: 72,
    hasNightAction: true,
    actionType: 'fox_sniff',
    tips: 'Chọn cụm 3 người chứa những đối tượng đáng ngờ nhất để không bị mất kỹ năng oan uổng.'
  },

  MEDIUM: {
    id: 'MEDIUM',
    name: 'Thầy Đồng',
    enName: 'Medium',
    team: 'villager',
    category: 'Dân Làng',
    color: '#b5179e',
    icon: '🕯️👻',
    badge: 'Thầy Đồng',
    shortDesc: 'Giao tiếp và nhận thông tin xác thực từ các linh hồn người đã chết.',
    fullDesc: 'Có khả năng kết nối với cõi âm. Mỗi đêm Thầy Đồng có thể chọn một linh hồn người đã khuất để biết chính xác vai trò thật sự của họ khi còn sống, kiểm chứng xem làng đã treo cổ đúng Sói hay giết nhầm dân lành.',
    nightPriority: 75,
    hasNightAction: true,
    actionType: 'medium_commune',
    tips: 'Giúp làng làm rõ những cái chết bí ẩn hoặc kiểm tra xem người vừa chết có phải Sói Ngụy Trang hay không.'
  },

  BODYGUARD: {
    id: 'BODYGUARD',
    name: 'Bảo Vệ',
    enName: 'Bodyguard',
    team: 'villager',
    category: 'Dân Làng',
    color: '#38b000',
    icon: '🛡️⚔️',
    badge: 'Bảo Vệ',
    shortDesc: 'Chặn đòn cắn chung; tự bảo vệ được; không lặp mục tiêu liên tiếp.',
    fullDesc: 'Mỗi đêm chọn bảo vệ 1 người chơi khỏi đòn cắn của đàn Sói. Có thể tự bảo vệ bản thân, nhưng không được phép bảo vệ cùng một người trong 2 đêm liên tiếp.',
    nightPriority: 30,
    hasNightAction: true,
    actionType: 'bodyguard_protect',
    tips: 'Dự đoán nước đi của bầy sói. Sau khi Tiên Tri lộ diện, hãy luân phiên bảo vệ Tiên Tri và những vai quan trọng khác.'
  },

  WITCH: {
    id: 'WITCH',
    name: 'Phù Thủy',
    enName: 'Witch',
    team: 'villager',
    category: 'Dân Làng',
    color: '#7209b7',
    icon: '🧪✨',
    badge: 'Phù Thủy',
    shortDesc: 'Một bình cứu, một bình độc; tối đa dùng một bình mỗi đêm.',
    fullDesc: 'Sở hữu 2 lọ độc dược quyền năng: Bình Cứu (cứu sống nạn nhân bị Sói cắn trong đêm) và Bình Độc (đầu độc giết chết 1 người chơi bất kỳ). Mỗi bình chỉ dùng 1 lần trong cả trận, và mỗi đêm chỉ được dùng tối đa 1 bình.',
    nightPriority: 66,
    hasNightAction: true,
    actionType: 'witch_brew',
    tips: 'Tiết kiệm bình cứu cho Tiên Tri hoặc chính bản thân. Dùng bình độc khi đã chắc chắn 90% kẻ khả nghi là Sói.'
  },

  PRIEST: {
    id: 'PRIEST',
    name: 'Mục Sư',
    enName: 'Priest',
    team: 'villager',
    category: 'Dân Làng',
    color: '#ffd166',
    icon: '✝️💧',
    badge: 'Mục Sư',
    shortDesc: 'Một bình nước thánh; dùng lên Sói thì giết Sói ngay lập tức.',
    fullDesc: 'Mang theo một bình Nước Thánh duy nhất trong cả trận. Mỗi đêm có thể tưới nước thánh lên một người: Nếu kẻ đó là Sói (hoặc Sát Nhân), tà ma sẽ bốc cháy và kẻ đó chết ngay lập tức! Nếu tưới lên Dân lành vô tội, không ai bị tổn thương nhưng Mục Sư mất bình nước thánh.',
    nightPriority: 68,
    hasNightAction: true,
    actionType: 'priest_holy_water',
    tips: 'Đây là vũ khí thanh trừng cực mạnh của dân làng, chỉ dùng khi có cơ sở nghi vấn vững chắc.'
  },

  DOCTOR: {
    id: 'DOCTOR',
    name: 'Bác Sĩ',
    enName: 'Doctor',
    team: 'villager',
    category: 'Dân Làng',
    color: '#06d6a0',
    icon: '🩺💊',
    badge: 'Bác Sĩ',
    shortDesc: 'Vai chữa trị; điều trị vết thương nặng và chữa khỏi mầm dịch bệnh.',
    fullDesc: 'Thức dậy mỗi đêm để chọn một người chăm sóc y tế. Nếu người đó đang nhiễm Dịch Bệnh từ Sói Dịch Bệnh, mầm bệnh sẽ được loại bỏ hoàn toàn. Bác sĩ cũng có thể cấp cứu người sắp bị thương tật.',
    nightPriority: 67,
    hasNightAction: true,
    actionType: 'doctor_heal',
    tips: 'Để ý những người có dấu hiệu bị ho lây lan hoặc thông báo dịch bệnh để ưu tiên cứu chữa.'
  },

  HUNTER: {
    id: 'HUNTER',
    name: 'Thợ Săn',
    enName: 'Hunter',
    team: 'villager',
    category: 'Dân Làng',
    color: '#b08968',
    icon: '🏹🎯',
    badge: 'Thợ Săn',
    shortDesc: 'Bắn hạ một người khi chết, trừ ngoại lệ bị quy định.',
    fullDesc: 'Khi Thợ Săn ngã xuống (dù bị Sói cắn đêm hay bị Dân làng xử tử ban ngày), trong hơi thở cuối cùng, Thợ Săn được quyền rút súng bắn chết một người chơi bất kỳ theo mình xuống mồ!',
    nightPriority: 90,
    hasNightAction: false, // kích hoạt khi chết
    actionType: 'hunter_revenge_shot',
    tips: 'Luôn chuẩn bị sẵn trong đầu mục tiêu đáng nghi nhất để nếu chẳng may ngã xuống có thể lập tức kéo theo một kẻ gian ác.'
  },

  ELDER: {
    id: 'ELDER',
    name: 'Già Làng',
    enName: 'Elder',
    team: 'villager',
    category: 'Dân Làng',
    color: '#7f5539',
    icon: '👴🛡️',
    badge: 'Già Làng',
    shortDesc: 'Chịu 2 đòn cắn Sói; chết do treo cổ/độc khiến phe Dân mất toàn bộ kỹ năng.',
    fullDesc: 'Người từng trải có sức sống phi thường: Phải chịu 2 lần bị Sói cắn mới chết (lần cắn đầu tiên chỉ mất 1 giáp). Tuy nhiên, nếu Già Làng bị dân làng treo cổ oan hoặc bị Phù Thủy đầu độc, sự phẫn uất của tổ tiên sẽ khiến toàn bộ phe Dân mất hết kỹ năng đặc biệt!',
    nightPriority: 60,
    hasNightAction: false,
    actionType: 'passive',
    tips: 'Dân làng phải hết sức thận trọng khi biểu quyết treo cổ Già Làng. Già Làng nên lên tiếng thanh minh khi bị dồn phiếu.'
  },

  SILVER_KNIGHT: {
    id: 'SILVER_KNIGHT',
    name: 'Kị Sĩ Giáp Bạc',
    enName: 'Knight with Silver Armor',
    team: 'villager',
    category: 'Dân Làng',
    color: '#adb5bd',
    icon: '🛡️🗡️',
    badge: 'Kị Sĩ',
    shortDesc: 'Nếu bị Sói cắn chết, Sói bên trái bị nhiễm độc/chém và chết đêm kế.',
    fullDesc: 'Mang thanh gươm bạc tẩm độc thần thánh. Nếu Kị Sĩ Giáp Bạc bị đàn Sói cắn chết trong đêm, con Sói ngồi gần nhất phía bên tay trái của anh ta sẽ bị gươm bạc chém trọng thương và độc phát tác chết vào cuối đêm kế tiếp!',
    nightPriority: 60,
    hasNightAction: false,
    actionType: 'passive_knight',
    tips: 'Vị trí chỗ ngồi của bạn là chiếc bẫy chết người đối với đàn sói hung hãn.'
  },

  VILLAGER: {
    id: 'VILLAGER',
    name: 'Dân Thường',
    enName: 'Villager',
    team: 'villager',
    category: 'Dân Làng',
    color: '#8ecae6',
    icon: '👨‍🌾',
    badge: 'Dân Làng',
    shortDesc: 'Không có kỹ năng đêm, chiến đấu bằng trí tuệ và lá phiếu ban ngày.',
    fullDesc: 'Người dân chất phác của ngôi làng. Ban đêm ngủ say, ban ngày thức giấc cùng làng tranh luận, lắng nghe lời khai, suy luận mâu thuẫn và dùng lá phiếu công lý để tìm ra loài sói hung ác.',
    nightPriority: 99,
    hasNightAction: false,
    actionType: 'none',
    tips: 'Đừng im lặng! Dân thường tích cực phân tích, soi xét thái độ và lời nói của mọi người sẽ giúp lộ diện chân tướng loài Sói.'
  },

  LYCAN: {
    id: 'LYCAN',
    name: 'Bán Sói',
    enName: 'Lycan',
    team: 'villager',
    category: 'Dân Làng',
    color: '#d4a373',
    icon: '🩸🐺',
    badge: 'Bán Sói',
    shortDesc: 'Thuộc phe Dân nhưng hiển thị là Sói khi bị Tiên Tri soi.',
    fullDesc: 'Mang trong mình dòng máu lai. Trái tim hoàn toàn thuộc về Phe Dân Làng và thắng cùng Dân, nhưng bản chất cơ thể phát ra tà khí sói: Khi Tiên Tri soi vào Bán Sói, kết quả sẽ báo là "Phe Sói"!',
    nightPriority: 99,
    hasNightAction: false,
    actionType: 'passive',
    tips: 'Nếu bị Tiên Tri chỉ mặt, hãy bình tĩnh giải thích logic và hành vi trong sạch của mình để tránh bị treo cổ oan.'
  },

  CUPID: {
    id: 'CUPID',
    name: 'Thần Tình Yêu (Cupid)',
    enName: 'Cupid',
    team: 'villager', // Ban đầu Dân, nếu ghép đôi khác phe thì theo phe Tình nhân
    category: 'Dân Làng',
    color: '#ff70a6',
    icon: '🏹💘',
    badge: 'Cupid',
    shortDesc: 'Ghép hai người thành Cặp Tình Nhân vào đêm đầu tiên.',
    fullDesc: 'Vào đêm đầu tiên, Thần Tình Yêu thức dậy và chọn 2 người bất kỳ trở thành Tình Nhân của nhau. Họ biết danh tính của nhau. Nếu một người chết, người kia sẽ tự vẫn chết theo. Nếu 2 người thuộc 2 phe khác nhau (Dân + Sói), họ trở thành Phe Thứ Ba với mục tiêu tiêu diệt tất cả người khác để cùng nhau sống sót!',
    nightPriority: 10,
    hasNightAction: true,
    actionType: 'cupid_link',
    tips: 'Có thể tự ghép bản thân với một người chơi khác hoặc ghép 2 người ngẫu nhiên để tạo nên những bước ngoặt kịch tính.'
  },

  MAYOR: {
    id: 'MAYOR',
    name: 'Thị Trưởng',
    enName: 'Mayor',
    team: 'villager',
    category: 'Dân Làng',
    color: '#ffb703',
    icon: '🎖️⚖️',
    badge: 'Thị Trưởng',
    shortDesc: 'Phiếu bầu ban ngày có trọng số 2 phiếu; phá vỡ thế hòa phiếu.',
    fullDesc: 'Nhà lãnh đạo tinh thần của ngôi làng. Ban ngày, mỗi lá phiếu biểu quyết treo cổ của Thị Trưởng được tính thành 2 phiếu. Khi xảy ra tình huống hòa phiếu, quyết định của Thị Trưởng là tiếng nói quyết định số phận người bị treo cổ.',
    nightPriority: 99,
    hasNightAction: false,
    actionType: 'passive_mayor',
    tips: 'Giữ kín thân phận ở giai đoạn đầu để tránh bị đàn sói nhắm đến thanh trừng sớm.'
  },

  DETECTIVE: {
    id: 'DETECTIVE',
    name: 'Thám Tử',
    enName: 'Detective',
    team: 'villager',
    category: 'Dân Làng',
    color: '#2a9d8f',
    icon: '🕵️‍♂️🔍',
    badge: 'Thám Tử',
    shortDesc: 'Mỗi đêm chọn 2 người để so sánh xem họ Cùng phe hay Khác phe.',
    fullDesc: 'Bậc thầy suy đoán logic. Mỗi đêm Thám Tử thức dậy và chọn 2 người chơi còn sống bất kỳ. Hệ thống sẽ trả lời cho Thám Tử biết 2 người này "Cùng Phe" hay "Khác Phe" với nhau.',
    nightPriority: 73,
    hasNightAction: true,
    actionType: 'detective_compare',
    tips: 'Hãy so sánh một người bạn đã biết chắc là Dân với một nghi phạm để xác định phe phái của nghi phạm đó.'
  },

  BLIND_ORACLE: {
    id: 'BLIND_ORACLE',
    name: 'Tiên Tri Mù',
    enName: 'Blind Oracle',
    team: 'villager',
    category: 'Dân Làng',
    color: '#48cae4',
    icon: '🦯🔮',
    badge: 'Tri Mù',
    shortDesc: 'Cảm nhận linh cảm mờ ảo: biết được số lượng Sói còn sống xung quanh mục tiêu.',
    fullDesc: 'Tuy đôi mắt mù lòa nhưng linh cảm phi thường. Mỗi đêm chọn 1 người: Giác quan thứ sáu sẽ báo cho Tiên Tri Mù biết mục tiêu đó có bao nhiêu con Sói nằm trong bán kính 1 người chơi xung quanh họ.',
    nightPriority: 74,
    hasNightAction: true,
    actionType: 'blind_oracle_sense',
    tips: 'Kết hợp thông tin chỗ ngồi để thu hẹp dần vòng vây quanh hang ổ bầy sói.'
  },

  ALCHEMIST: {
    id: 'ALCHEMIST',
    name: 'Nhà Giả Kim',
    enName: 'Alchemist',
    team: 'villager',
    category: 'Dân Làng',
    color: '#90be6d',
    icon: '⚗️✨',
    badge: 'Giả Kim',
    shortDesc: 'Thanh tẩy các trạng thái xấu hợp lệ (đóng băng, ảo ảnh, ác mộng, câm lặng).',
    fullDesc: 'Bậc thầy pha chế thảo dược thanh tẩy. Có 2 lọ Thanh Tẩy trong ván chơi. Mỗi đêm có thể dùng 1 lọ lên một người để hóa giải mọi lời nguyền xấu: gỡ bỏ đóng băng của Sói Băng Giá, xóa tan cơn mê muội của Sói Ác Mộng, phá tan ảo ảnh ngụy trang.',
    nightPriority: 35,
    hasNightAction: true,
    actionType: 'alchemist_cleanse',
    tips: 'Quan sát ai bị đóng băng mất tiếng nói để thanh tẩy cho họ kịp thời phát huy sức mạnh.'
  },

  JUDGE: {
    id: 'JUDGE',
    name: 'Thẩm Phán',
    enName: 'Judge',
    team: 'villager',
    category: 'Dân Làng',
    color: '#5e503f',
    icon: '👨‍⚖️🔨',
    badge: 'Thẩm Phán',
    shortDesc: 'Một lần trong game có thể phủ quyết việc treo cổ hoặc mở phiên tòa xử tử thứ hai.',
    fullDesc: 'Người thực thi công lý tối cao. Có 1 quyền năng Phủ Quyết đặc biệt: Khi một người chơi vô tội bị dân làng biểu quyết treo cổ, Thẩm Phán có thể gõ búa tuyên bố ân xá cứu người đó, hoặc ra lệnh mở ngay một phiên tòa thứ hai trong ngày để xét xử kẻ phản nghịch!',
    nightPriority: 99,
    hasNightAction: false, // kích hoạt ban ngày
    actionType: 'judge_overrule',
    tips: 'Can thiệp vào khoảnh khắc quyết định khi Già Làng hay Tiên Tri sắp bị vu oan giáng họa.'
  },

  STORYTELLER: {
    id: 'STORYTELLER',
    name: 'Người Kể Chuyện',
    enName: 'Storyteller',
    team: 'villager',
    category: 'Dân Làng',
    color: '#e76f51',
    icon: '📖🎭',
    badge: 'Kể Chuyện',
    shortDesc: 'Mỗi 2 ngày tiết lộ một câu chuyện ngụ ngôn ẩn chứa gợi ý vai trò thật trong làng.',
    fullDesc: 'Nhà thông thái lưu giữ bí mật ngôi làng. Ban ngày (từ Ngày 2 trở đi), Người Kể Chuyện có thể kể một mẩu truyện ngụ ngôn, hệ thống sẽ công bố cho toàn làng một gợi ý bí mật xác thực (ví dụ: "Trong số người chơi A, B, C có đúng một ác quỷ bóng tối").',
    nightPriority: 99,
    hasNightAction: false,
    actionType: 'storyteller_hint',
    tips: 'Dùng những gợi ý khách quan để hướng sự chú ý của dân làng về phía những nghi can có tên trong chuyện.'
  },

  // ==========================================
  // 7.3. PHE ĐỘC LẬP — 6 LOẠI
  // ==========================================
  FOOL_TANNER: {
    id: 'FOOL_TANNER',
    name: 'Kẻ Ngốc / Chán Đời',
    enName: 'Fool / Tanner',
    team: 'neutral',
    category: 'Độc Lập',
    color: '#e9c46a',
    icon: '🤡🪢',
    badge: 'Kẻ Ngốc',
    shortDesc: 'Muốn bị xử tử ban ngày; nếu bị treo cổ sẽ thắng cuộc ngay lập tức!',
    fullDesc: 'Một kẻ chán ghét cuộc đời và cuồng loạn. Mục tiêu duy nhất của Kẻ Ngốc là bị dân làng biểu quyết đưa lên giàn treo cổ vào ban ngày. Nếu bị treo cổ thành công, Kẻ Ngốc thắng ván cờ ngay lập tức và trò chơi kết thúc với sự thất bại của cả Dân và Sói!',
    nightPriority: 99,
    hasNightAction: false,
    actionType: 'passive',
    tips: 'Hãy diễn xuất đáng ngờ vừa đủ, nói năng lập lờ như một con Sói sơ hở để kích động dân làng dồn phiếu treo cổ bạn.'
  },

  SERIAL_KILLER: {
    id: 'SERIAL_KILLER',
    name: 'Sát Nhân Hàng Loạt',
    enName: 'Serial Killer',
    team: 'neutral',
    category: 'Độc Lập',
    color: '#9b2226',
    icon: '🔪🩸',
    badge: 'Sát Nhân',
    shortDesc: 'Mỗi đêm giết một người; kháng 1 đòn cắn Sói; mục tiêu là người sống sót duy nhất.',
    fullDesc: 'Kẻ sát nhân cô độc khát máu. Thức dậy mỗi đêm riêng biệt và chọn một người để sát hại. Hắn có một lớp áo giáp bí mật giúp kháng lại đòn cắn đầu tiên của đàn Sói. Mục tiêu tối hậu: Tiêu diệt cả đàn Sói và dân làng để trở thành kẻ duy nhất còn sống.',
    nightPriority: 64,
    hasNightAction: true,
    actionType: 'serial_killer_stab',
    tips: 'Ưu tiên triệt hạ bầy sói trước vì sói là mối đe dọa lớn nhất, đồng thời tránh để Tiên Tri soi ra mình.'
  },

  DOPPELGANGER: {
    id: 'DOPPELGANGER',
    name: 'Kẻ Biến Hình',
    enName: 'Doppelgänger',
    team: 'neutral',
    category: 'Độc Lập',
    color: '#4361ee',
    icon: '👥🪞',
    badge: 'Biến Hình',
    shortDesc: 'Chọn bản sao đêm đầu; khi bản sao chết thì nhận vai và kỹ năng của người đó.',
    fullDesc: 'Vào Đêm 1, Kẻ Biến Hình thức dậy và chọn 1 người chơi làm "Bản Sao Mẫu". Chừng nào người đó còn sống, Kẻ Biến Hình vẫn đóng vai một người vô danh. Khi Bản Sao Mẫu chết, Kẻ Biến Hình lập tức thức tỉnh, kế thừa toàn bộ vai trò, phe phái và kỹ năng của người đó!',
    nightPriority: 12,
    hasNightAction: true,
    actionType: 'doppelganger_mark',
    tips: 'Nên chọn sao chép những người chơi năng nổ hoặc có khả năng mang vai quan trọng để khi họ hy sinh bạn sẽ tiếp bước sứ mệnh.'
  },

  AVENGER: {
    id: 'AVENGER',
    name: 'Kẻ Báo Thù',
    enName: 'Avenger',
    team: 'neutral',
    category: 'Độc Lập',
    color: '#ae2012',
    icon: '⚔️🔥',
    badge: 'Báo Thù',
    shortDesc: 'Có một Kẻ Thù chỉ định; thắng khi Kẻ Thù bị loại bỏ bằng mọi giá.',
    fullDesc: 'Nuôi mối thù truyền kiếp. Đêm 1 được chỉ định một "Kẻ Thù Truyền Kiếp" trong làng. Nếu Kẻ Thù bị treo cổ hoặc chết trong đêm, Kẻ Báo Thù hoàn thành thù hận và kích hoạt lá chắn bảo hộ cho bản thân, thắng chung cuộc cùng phe chiến thắng cuối cùng.',
    nightPriority: 15,
    hasNightAction: false,
    actionType: 'avenger_bind',
    tips: 'Tìm cách kích động làng hoặc dẫn dắt lập luận sao cho Kẻ Thù của bạn trở thành mục tiêu bị loại bỏ sớm nhất.'
  },

  CULT_LEADER: {
    id: 'CULT_LEADER',
    name: 'Giáo Chủ',
    enName: 'Cult Leader',
    team: 'neutral',
    category: 'Độc Lập',
    color: '#5a189a',
    icon: '🔮🛐',
    badge: 'Giáo Chủ',
    shortDesc: 'Mỗi đêm truyền đạo thu nạp 1 tín đồ; thắng khi toàn bộ người sống là tín đồ.',
    fullDesc: 'Thủ lĩnh của một tà giáo bí mật. Mỗi đêm, Giáo Chủ thức dậy và chọn một người chơi để truyền đạo kết nạp vào Giáo Phái. Người bị truyền đạo vẫn giữ nguyên kỹ năng của vai gốc. Giáo Chủ thắng cuộc ngay khi TẤT CẢ người chơi còn sống đều đã trở thành tín đồ!',
    nightPriority: 80,
    hasNightAction: true,
    actionType: 'cult_convert',
    tips: 'Truyền đạo cho những người ít có khả năng bị Sói cắn hoặc bị treo cổ để tích lũy số lượng tín đồ nhanh nhất.'
  },

  PARASITE: {
    id: 'PARASITE',
    name: 'Kẻ Ký Sinh',
    enName: 'Parasite',
    team: 'neutral',
    category: 'Độc Lập',
    color: '#386641',
    icon: '🐛🧬',
    badge: 'Ký Sinh',
    shortDesc: 'Ký sinh vào một vật chủ đêm đầu; thắng nếu vật chủ sống sót đến cuối trận.',
    fullDesc: 'Sinh vật ký sinh quỷ quyệt. Đêm 1 chọn một người làm Vật Chủ. Kẻ Ký Sinh chia sẻ số phận với vật chủ nhưng có thể che chở cho vật chủ 1 lần khỏi cái chết. Nếu Vật Chủ sống sót và giành chiến thắng cuối cùng, Kẻ Ký Sinh cũng thắng trọn vẹn!',
    nightPriority: 14,
    hasNightAction: true,
    actionType: 'parasite_attach',
    tips: 'Hãy âm thầm bảo vệ và dùng lá phiếu ban ngày để bảo toàn tính mạng cho Vật Chủ của bạn bằng mọi giá.'
  }
};

// Mảng danh sách 36 vai để dễ lặp và lọc
export const ROLE_LIST = Object.values(ROLES);

// Preset phòng chơi mẫu phổ biến
export const GAME_PRESETS = [
  {
    id: 'preset_beginner',
    name: 'Tân Thủ Học Việc',
    playerCount: 8,
    description: 'Cấu hình kinh điển dễ chơi, cân bằng cho người mới bắt đầu.',
    roles: [
      'WEREWOLF', 'WEREWOLF',
      'SEER', 'BODYGUARD', 'WITCH', 'HUNTER',
      'VILLAGER', 'VILLAGER'
    ]
  },
  {
    id: 'preset_standard',
    name: 'Đêm Trăng Máu',
    playerCount: 10,
    description: 'Bổ sung Sói Con trả thù và Thần Tình Yêu xe duyên kịch tính.',
    roles: [
      'WEREWOLF', 'WEREWOLF', 'WOLF_CUB',
      'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID',
      'MAYOR', 'VILLAGER'
    ]
  },
  {
    id: 'preset_expert',
    name: 'Hắc Ma & Hỗn Loạn',
    playerCount: 12,
    description: 'Sói Chúa nhiễm hóa, Kẻ Ngốc chán đời và Thám tử suy luận sắc bén.',
    roles: [
      'ALPHA_WOLF', 'FROST_WOLF', 'WEREWOLF',
      'SEER', 'BODYGUARD', 'WITCH', 'DETECTIVE', 'DOCTOR', 'ELDER',
      'FOOL_TANNER', 'VILLAGER', 'VILLAGER'
    ]
  },
  {
    id: 'preset_all_stars',
    name: 'Đại Chiến 36 Sao',
    playerCount: 16,
    description: 'Đầy đủ các vai độc đáo: Sát Nhân, Sói Dịch Bệnh, Giả Kim, Giáo Chủ!',
    roles: [
      'ALPHA_WOLF', 'PLAGUE_WOLF', 'ILLUSION_WOLF', 'WHITE_WEREWOLF',
      'SEER', 'APPRENTICE_SEER', 'FOX', 'BODYGUARD', 'WITCH', 'PRIEST', 'ALCHEMIST', 'SILVER_KNIGHT', 'JUDGE',
      'SERIAL_KILLER', 'CULT_LEADER', 'DOPPELGANGER'
    ]
  }
];

// Danh sách danh xưng bot tiếng Việt thân thiện
export const BOT_NAMES = [
  { name: 'Minh Trí', gender: 'm', avatar: '👨‍💼', trait: 'Logic & Điềm tĩnh' },
  { name: 'Bảo Ngọc', gender: 'f', avatar: '👩‍💼', trait: 'Sắc sảo & Hoài nghi' },
  { name: 'Tuấn Kiệt', gender: 'm', avatar: '👨‍🎓', trait: 'Hùng biện & Quyết đoán' },
  { name: 'Thanh Hà', gender: 'f', avatar: '👩‍🏫', trait: 'Quan sát & Thận trọng' },
  { name: 'Hải Đăng', gender: 'm', avatar: '👦', trait: 'Nhút nhát & Sợ chết' },
  { name: 'Quỳnh Như', gender: 'f', avatar: '👧', trait: 'Cảm tính & Trung thực' },
  { name: 'Quang Huy', gender: 'm', avatar: '🧔', trait: 'Nóng tính & Thích vote' },
  { name: 'Mai Linh', gender: 'f', avatar: '👩‍⚕️', trait: 'Dĩ hòa vi quý' },
  { name: 'Đức Anh', gender: 'm', avatar: '👨‍💻', trait: 'Phân tích xác suất' },
  { name: 'Phương Thảo', gender: 'f', avatar: '👩‍🎨', trait: 'Trực giác nhạy bén' },
  { name: 'Hoàng Nam', gender: 'm', avatar: '👮‍♂️', trait: 'Nguyên tắc công lý' },
  { name: 'Khánh Vy', gender: 'f', avatar: '👱‍♀️', trait: 'Khéo léo & Đảo lời' },
  { name: 'Gia Bảo', gender: 'm', avatar: '🧑', trait: 'Hồn nhiên, vô tư' },
  { name: 'Ánh Tuyết', gender: 'f', avatar: '🧕', trait: 'Bí ẩn, ít nói' },
  { name: 'Văn Hùng', gender: 'm', avatar: '👨‍🌾', trait: 'Chất phác, cương trực' },
  { name: 'Kim Ngân', gender: 'f', avatar: '👸', trait: 'Tự tin, thích dẫn đầu' },
  { name: 'Tấn Phát', gender: 'm', avatar: '👨‍🍳', trait: 'Hay đùa cợt' },
  { name: 'Thùy Chi', gender: 'f', avatar: '👩‍🔬', trait: 'Thích bắt bẻ mâu thuẫn' }
];
