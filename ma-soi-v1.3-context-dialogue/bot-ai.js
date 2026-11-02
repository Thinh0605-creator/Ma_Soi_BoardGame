// bot-ai.js - Trí tuệ nhân tạo cho Bot Ma Sói với khả năng suy luận, chat tranh luận và biểu quyết

import { ROLES } from './roles.js';

export class BotAI {
  constructor(engine) {
    this.engine = engine;
  }

  // Khởi tạo bộ nhớ cho từng Bot
  initBotMemory(bot) {
    if (!bot.aiMemory) {
      bot.aiMemory = {
        suspicions: {}, // { playerId: number (0 - 100) }
        knownRoles: {}, // { playerId: roleId }
        claimedRoles: {}, // { playerId: roleId }
        roleNotes: [],
        votedHistory: []
      };

      // Điểm nghi ngờ cơ bản ban đầu
      this.engine.players.forEach(p => {
        if (p.id !== bot.id) {
          bot.aiMemory.suspicions[p.id] = 40 + Math.floor(Math.random() * 20); // 40-60
        }
      });

      // Nếu bot là Sói: biết ai là đồng đội Sói, điểm nghi ngờ đồng đội = 0 (trừ Sói Trắng)
      if (bot.team === 'werewolf') {
        this.engine.players.forEach(p => {
          if (p.team === 'werewolf' && p.id !== bot.id) {
            bot.aiMemory.suspicions[p.id] = (bot.role === 'WHITE_WEREWOLF') ? 30 : 0;
            bot.aiMemory.knownRoles[p.id] = p.role;
          }
        });
      }

      // Nếu bot là Cặp Tình Nhân: biết người yêu
      if (bot.lovedOneId) {
        bot.aiMemory.suspicions[bot.lovedOneId] = 0;
      }
    }
  }

  // ==========================================
  // HÀNH ĐỘNG BAN ĐÊM CỦA BOT
  // ==========================================
  decideNightAction(bot) {
    this.initBotMemory(bot);
    const alivePlayers = this.engine.getAlivePlayers();
    const otherAlive = alivePlayers.filter(p => p.id !== bot.id);
    const nonWolfAlive = alivePlayers.filter(p => p.team !== 'werewolf');

    switch (bot.role) {
      // 1. Phe Sói Cắn
      case 'WEREWOLF':
      case 'WOLF_CUB':
      case 'DISGUISED_WOLF':
      case 'ALPHA_WOLF':
      case 'FROST_WOLF':
      case 'NIGHTMARE_WOLF':
      case 'ILLUSION_WOLF':
      case 'PLAGUE_WOLF':
      case 'WHITE_WEREWOLF': {
        // Chọn con mồi không phải sói
        if (nonWolfAlive.length === 0) return null;
        // Ưu tiên cắn người bị nghi là Tiên Tri / Bảo Vệ hoặc người chơi thật
        // (Người chơi thật KHÔNG được ưu tiên: chỉ ưu tiên ai đã công khai vai trò, còn lại ngẫu nhiên)
        const scored = nonWolfAlive.map(p => ({
          p,
          score: (bot.aiMemory?.claimedRoles[p.id] ? 20 : 0) + Math.random() * 20
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored[0].p.id;
      }

      // 2. Sói Trùm Nhiễm Hóa
      case 'ALPHA_WOLF_INFECT': {
        if (!bot.specialAbilityUsed && nonWolfAlive.length > 0) {
          // 40% cơ hội dùng nếu gặp người chơi quan trọng
          const candidate = nonWolfAlive.find(p => p.role === 'SEER' || p.role === 'MAYOR');
          if (candidate && Math.random() < 0.6) {
            return candidate.id;
          }
        }
        return null;
      }

      // 3. Sói Băng Giá Đóng Băng
      case 'FROST_WOLF_FREEZE': {
        if (nonWolfAlive.length === 0) return null;
        const candidate = nonWolfAlive.sort((a, b) => Math.random() - 0.5)[0];
        return candidate.id;
      }

      // 4. Sói Ác Mộng Gieo Nguyền
      case 'NIGHTMARE_WOLF_CURSE': {
        if (nonWolfAlive.length === 0) return null;
        // Nguyền rủa người uy tín
        const candidate = nonWolfAlive.find(p => p.role === 'SEER' || p.role === 'WITCH') || nonWolfAlive[Math.floor(Math.random() * nonWolfAlive.length)];
        return candidate.id;
      }

      // 5. Sói Ảo Ảnh Phù Phép
      case 'ILLUSION_WOLF_CAST': {
        const wolves = alivePlayers.filter(p => p.team === 'werewolf');
        return wolves[Math.floor(Math.random() * wolves.length)].id;
      }

      // 6. Sói Dịch Bệnh Gieo Mầm Bệnh
      case 'PLAGUE_WOLF_INFECT': {
        const targets = nonWolfAlive.filter(p => !p.isInfected);
        if (targets.length === 0) return null;
        return targets[Math.floor(Math.random() * targets.length)].id;
      }

      // 7. Sói Trắng cắn Sói khác (đêm chẵn)
      case 'WHITE_WEREWOLF_SOLO': {
        const otherWolves = alivePlayers.filter(p => p.team === 'werewolf' && p.id !== bot.id);
        if (otherWolves.length === 0) return null;
        return otherWolves[Math.floor(Math.random() * otherWolves.length)].id;
      }

      // 8. Tiên Tri Soi
      case 'SEER':
      case 'APPRENTICE_SEER_ACTIVE': {
        // Tìm người sống chưa biết vai có độ nghi ngờ cao nhất
        const uninspected = otherAlive.filter(p => !bot.aiMemory.knownRoles[p.id]);
        if (uninspected.length === 0) return otherAlive[0]?.id;
        uninspected.sort((a, b) => bot.aiMemory.suspicions[b.id] - bot.aiMemory.suspicions[a.id]);
        return uninspected[0].id;
      }

      // 9. Cáo Soi Cụm 3
      case 'FOX': {
        if (bot.specialAbilityLost) return null;
        return otherAlive[Math.floor(Math.random() * otherAlive.length)]?.id;
      }

      // 10. Thám Tử So Sánh 2 Người
      case 'DETECTIVE': {
        if (otherAlive.length < 2) return null;
        const shuffled = [...otherAlive].sort(() => Math.random() - 0.5);
        return [shuffled[0].id, shuffled[1].id];
      }

      // 11. Bảo Vệ Canh Gác
      case 'BODYGUARD': {
        // Không được bảo vệ người cũ liên tiếp
        const validTargets = alivePlayers.filter(p => p.id !== bot.lastProtectedId);
        // Ưu tiên bảo vệ người đã lộ diện là Tiên tri / Dân uy tín, hoặc tự bảo vệ khi nguy hiểm
        const seerClaim = alivePlayers.find(p => bot.aiMemory.claimedRoles[p.id] === 'SEER' && p.id !== bot.lastProtectedId);
        if (seerClaim && Math.random() < 0.75) return seerClaim.id;
        if (validTargets.length === 0) return null;
        // 30% tự bảo vệ
        if (bot.id !== bot.lastProtectedId && Math.random() < 0.3) return bot.id;
        return validTargets[Math.floor(Math.random() * validTargets.length)].id;
      }

      // 12. Phù Thủy (Cứu / Độc)
      case 'WITCH': {
        const wolfVictimId = this.engine.nightContext.wolfVictimId;
        const victim = this.engine.getPlayer(wolfVictimId);

        // Quyết định cứu
        let healTargetId = null;
        if (bot.hasHealPotion && victim && victim.isAlive) {
          // Cứu nếu là bản thân, hoặc nếu nạn nhân là người có độ nghi ngờ thấp (người tốt)
          const sus = bot.aiMemory.suspicions[victim.id] || 50;
          if (victim.id === bot.id || sus < 55 || this.engine.dayNumber === 1) {
            healTargetId = victim.id;
          }
        }

        // Quyết định độc (chỉ dùng nếu chưa cứu đêm nay)
        let poisonTargetId = null;
        if (!healTargetId && bot.hasPoisonPotion && this.engine.dayNumber >= 2) {
          // Tìm kẻ có độ nghi ngờ cực cao (> 85)
          const highSusTargets = otherAlive.filter(p => (bot.aiMemory.suspicions[p.id] || 0) > 85);
          if (highSusTargets.length > 0 && Math.random() < 0.5) {
            poisonTargetId = highSusTargets[0].id;
          }
        }

        return { healTargetId, poisonTargetId };
      }

      // 13. Mục Sư Dùng Nước Thánh
      case 'PRIEST': {
        if (bot.specialAbilityUsed) return null;
        // Chỉ dùng khi chắc chắn hoặc nghi ngờ rất cao
        const targets = otherAlive.filter(p => (bot.aiMemory.suspicions[p.id] || 0) > 80);
        if (targets.length > 0 && Math.random() < 0.4) {
          return targets[0].id;
        }
        return null;
      }

      // 14. Bác Sĩ Cứu Chữa
      case 'DOCTOR': {
        // Cứu người bị nhiễm bệnh hoặc người bất kỳ
        const infected = alivePlayers.find(p => p.isInfected);
        if (infected) return infected.id;
        return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
      }

      // 15. Thần Tình Yêu (Đêm 1)
      case 'CUPID': {
        if (alivePlayers.length < 2) return null;
        const pair = [...alivePlayers].sort(() => Math.random() - 0.5).slice(0, 2);
        return [pair[0].id, pair[1].id];
      }

      // 16. Sát Nhân Hàng Loạt
      case 'SERIAL_KILLER': {
        if (otherAlive.length === 0) return null;
        // Giết người ngẫu nhiên hoặc người thông minh nhất
        const target = otherAlive[Math.floor(Math.random() * otherAlive.length)];
        return target.id;
      }

      // 17. Giáo Chủ Truyền Đạo
      case 'CULT_LEADER': {
        const nonCult = otherAlive.filter(p => !p.isCultMember);
        if (nonCult.length === 0) return null;
        return nonCult[Math.floor(Math.random() * nonCult.length)].id;
      }

      // 18. Nhà Giả Kim Thanh Tẩy
      case 'ALCHEMIST': {
        if (bot.cleansePotions <= 0) return null;
        const debuffed = alivePlayers.find(p => p.isFrozen || p.isNightmared || p.isInfected);
        if (debuffed) return debuffed.id;
        return null;
      }

      // 19. Kẻ Biến Hình (Đêm 1)
      case 'DOPPELGANGER': {
        return otherAlive[Math.floor(Math.random() * otherAlive.length)]?.id;
      }

      // 20. Kẻ Ký Sinh (Đêm 1)
      case 'PARASITE': {
        return otherAlive[Math.floor(Math.random() * otherAlive.length)]?.id;
      }

      default:
        return null;
    }
  }

  // ==========================================
  // THẢO LUẬN BAN NGÀY & PHÁT BIỂU CHAT
  // ==========================================
  generateDayChat(bot, topic = 'general') {
    this.initBotMemory(bot);
    const alivePlayers = this.engine.getAlivePlayers();
    const otherAlive = alivePlayers.filter(p => p.id !== bot.id);
    const deadLastNight = this.engine.lastNightDeaths || [];

    // 1. Kẻ Ngốc (Tanner): Cố tình nói những câu gây ức chế, đáng ngờ để bị treo cổ
    if (bot.role === 'FOOL_TANNER') {
      const foolQuotes = [
        'Cứ treo cổ tôi thử xem, rồi cả làng sẽ phải hối hận đấy!',
        'Đêm qua tôi bận đi... ngắm trăng, ai chết thì kệ chứ!',
        'Mấy người cứ nghi ngờ tôi đi, tôi đâu có sợ bị treo cổ đâu haha!',
        'Tôi thấy nghi tất cả mọi người, kể cả bản thân tôi luôn!',
        'Nếu hôm nay không ai vote tôi, tôi sẽ tự vote chính mình!'
      ];
      return foolQuotes[Math.floor(Math.random() * foolQuotes.length)];
    }

    // 2. Tiên Tri có thông tin soi Sói
    if (bot.role === 'SEER' || (bot.role === 'APPRENTICE_SEER' && bot.isSeerAwakened)) {
      const foundWolfId = Object.keys(bot.aiMemory.knownRoles).find(id => {
        const r = bot.aiMemory.knownRoles[id];
        return r && (r.includes('WOLF') || r === 'LYCAN');
      });

      if (foundWolfId) {
        const wolfPlayer = this.engine.getPlayer(foundWolfId);
        if (wolfPlayer && wolfPlayer.isAlive) {
          bot.aiMemory.claimedRoles[bot.id] = 'SEER';
          const seerClaims = [
            `Tôi là Tiên Tri! Đêm qua tôi vừa soi trúng ${wolfPlayer.name}, hắn chính là SÓI! Mau vote hắn đi!`,
            `Dân làng nghe tôi! Tôi xin nhận vai Tiên Tri: ${wolfPlayer.name} có dã tâm của loài Sói, hãy treo cổ hắn ngay!`,
            `Không còn nghi ngờ gì nữa, quả cầu tiên tri của tôi báo hiệu ${wolfPlayer.name} thuộc phe Sói!`
          ];
          return seerClaims[Math.floor(Math.random() * seerClaims.length)];
        }
      }

      // Nếu soi ra Dân Lành
      const foundVillagerId = Object.keys(bot.aiMemory.knownRoles).find(id => {
        const p = this.engine.getPlayer(id);
        return p && p.isAlive && !p.role.includes('WOLF') && p.role !== 'LYCAN';
      });
      if (foundVillagerId && Math.random() < 0.4) {
        const villager = this.engine.getPlayer(foundVillagerId);
        return `Đêm qua tôi đã soi ${villager.name}, người này thuộc phe Dân Làng lương thiện, mọi người có thể an tâm tin tưởng.`;
      }
    }

    // 3. Phe Sói: Tung hỏa mù, đổ tội cho người có độ nghi ngờ cao
    if (bot.team === 'werewolf') {
      // Tìm 1 dân làng để đổ tội
      const innocentTargets = otherAlive.filter(p => p.team !== 'werewolf');
      if (innocentTargets.length > 0) {
        const target = innocentTargets.sort((a, b) => (bot.aiMemory.suspicions[b.id] || 0) - (bot.aiMemory.suspicions[a.id] || 0))[0];
        const wolfQuotes = [
          `Tôi để ý thấy ${target.name} từ đầu ván tới giờ nói năng ấp úng, rất đáng nghi!`,
          `Có ai thấy ${target.name} hôm nay im lặng một cách bất thường không? Cẩn thận kẻo bị lừa!`,
          `Tôi là Dân thường thôi, nhưng nhìn lối suy luận của ${target.name} tôi thấy giống Sói đang cố dẫn dắt dư luận lắm.`,
          `Đêm qua ${deadLastNight[0]?.name || 'dân làng'} bị cắn, tôi đồ rằng ${target.name} có liên quan trực tiếp!`,
          `Mọi người đừng nghe linh tinh, hãy tập trung vào ${target.name} đi kìa!`
        ];
        return wolfQuotes[Math.floor(Math.random() * wolfQuotes.length)];
      }
    }

    // 4. Bảo Vệ / Phù Thủy / Thị Trưởng / Dân Làng thông thường
    // Tìm người bị nghi ngờ nhất trong làng
    const sortedTargets = [...otherAlive].sort((a, b) => (bot.aiMemory.suspicions[b.id] || 0) - (bot.aiMemory.suspicions[a.id] || 0));
    const suspect = sortedTargets[0];

    const generalQuotes = [
      `Đêm qua ${deadLastNight.map(d => d.name).join(', ') || 'không ai chết, bình yên kỳ lạ'}, chúng ta cần bàn bạc thật cẩn trọng.`,
      suspect ? `Theo quan sát của tôi, ${suspect.name} đang có những phát biểu khá mâu thuẫn.` : 'Tôi đang lắng nghe xem ai lộ sơ hở.',
      suspect ? `Tôi nghĩ hôm nay chúng ta nên yêu cầu ${suspect.name} đứng lên tự bào chữa trước khi biểu quyết.` : 'Mọi người giữ bình tĩnh, đừng vội vã vote hùa!',
      `Hôm nay là Ngày ${this.engine.dayNumber}, đàn sói chắc chắn đang ẩn nấp rất kỹ trong số chúng ta.`,
      `Nếu ai là Tiên Tri hay có chức năng soi, hãy đứng ra dẫn dắt dân làng vào lúc này!`,
      `Tôi tin tưởng ${otherAlive[otherAlive.length - 1]?.name || 'dân làng'}, nhưng người khác thì chưa chắc.`
    ];

    return generalQuotes[Math.floor(Math.random() * generalQuotes.length)];
  }

  // ==========================================
  // PHẢN HỒI KHI NGƯỜI CHƠI THẬT (USER) CHAT
  // ==========================================
  respondToUserChat(bot, userMessage, userPlayer) {
    this.initBotMemory(bot);
    const lower = userMessage.toLowerCase();

    // 1. Nếu User nhận mình là Tiên Tri
    if (lower.includes('tiên tri') || lower.includes('seer') || lower.includes('soi')) {
      if (bot.role === 'SEER') {
        return `${userPlayer.name} nói láo! TÔI mới chính là Tiên Tri thật của làng này! Làng đừng để bị bịp!`;
      } else if (bot.team === 'werewolf') {
        bot.aiMemory.suspicions[userPlayer.id] = 90;
        return `${userPlayer.name} nhận Tiên Tri hả? Đêm qua bạn soi ai, kết quả thế nào nói rõ xem có khớp không?`;
      } else {
        return `Chào Tiên Tri ${userPlayer.name}! Đêm qua bạn soi được ai rồi, mau báo tin cho dân làng biết với!`;
      }
    }

    // 2. Nếu User cáo buộc bot là Sói
    if (lower.includes(bot.name.toLowerCase()) && (lower.includes('sói') || lower.includes('vote') || lower.includes('treo'))) {
      if (bot.role === 'FOOL_TANNER') {
        return `Đúng rồi đó ${userPlayer.name}! Tôi là Sói đấy, ngon thì vote treo cổ tôi đi xem nào!`;
      }
      bot.aiMemory.suspicions[userPlayer.id] = Math.min(100, (bot.aiMemory.suspicions[userPlayer.id] || 50) + 25);
      const defenseQuotes = [
        `Khoan đã ${userPlayer.name}! Bạn dựa vào bằng chứng gì mà vu oan cho tôi là Sói?`,
        `Tôi là người tốt 100%! ${userPlayer.name} đang cố tình dồn phiếu hại người vô tội để che giấu thân phận thì có!`,
        `Đừng vu khống tôi! Tôi đã làm gì tổn hại đến làng mà bạn đòi treo cổ tôi?`
      ];
      return defenseQuotes[Math.floor(Math.random() * defenseQuotes.length)];
    }

    // 3. Nếu User kêu gọi vote một ai đó
    const mentionedPlayer = this.engine.players.find(p => p.isAlive && lower.includes(p.name.toLowerCase()) && p.id !== userPlayer.id);
    if (mentionedPlayer) {
      if (bot.team === 'werewolf' && mentionedPlayer.team === 'werewolf') {
        return `Tôi thấy ${mentionedPlayer.name} cũng bình thường mà, sao ${userPlayer.name} lại nhắm vào họ vậy? Cần xem xét thêm.`;
      } else {
        bot.aiMemory.suspicions[mentionedPlayer.id] = Math.min(100, (bot.aiMemory.suspicions[mentionedPlayer.id] || 50) + 15);
        return `Lập luận của ${userPlayer.name} về ${mentionedPlayer.name} khá có lý. Để tôi cân nhắc bỏ phiếu cho trường hợp này.`;
      }
    }

    // Phản hồi ngẫu nhiên nếu nói chung chung
    const genericReplies = [
      `Ý kiến của ${userPlayer.name} cũng đáng suy ngẫm, nhưng chúng ta cần thêm dữ kiện.`,
      `Tôi đồng ý với ${userPlayer.name}, làng cần hành động dứt khoát trước khi quá muộn.`,
      `Mọi người hãy nhìn vào danh sách người đã chết đêm qua để suy luận tiếp nhé.`
    ];
    return genericReplies[Math.floor(Math.random() * genericReplies.length)];
  }

  // ==========================================
  // QUYẾT ĐỊNH BỎ PHIẾU TREO CỔ (VOTING)
  // ==========================================
  decideVote(bot) {
    this.initBotMemory(bot);
    const alivePlayers = this.engine.getAlivePlayers();
    const otherAlive = alivePlayers.filter(p => p.id !== bot.id);

    // Kẻ Ngốc tự vote chính mình hoặc vote người kích động
    if (bot.role === 'FOOL_TANNER') {
      // 50% tự vote mình
      if (Math.random() < 0.5) return bot.id;
    }

    // Nếu bot là Sói:
    if (bot.team === 'werewolf') {
      const nonWolves = otherAlive.filter(p => p.team !== 'werewolf');
      if (nonWolves.length > 0) {
        // Vote cho dân có nhiều phiếu nhất hoặc người nghi ngờ cao nhất
        nonWolves.sort((a, b) => (bot.aiMemory.suspicions[b.id] || 0) - (bot.aiMemory.suspicions[a.id] || 0));
        return nonWolves[0].id;
      }
    }

    // Dân làng: vote cho kẻ có điểm nghi ngờ cao nhất (> 65)
    otherAlive.sort((a, b) => (bot.aiMemory.suspicions[b.id] || 0) - (bot.aiMemory.suspicions[a.id] || 0));
    const highestSuspect = otherAlive[0];

    // Nếu điểm nghi ngờ quá thấp (< 50), có thể skip vote (bỏ phiếu trắng)
    if ((bot.aiMemory.suspicions[highestSuspect.id] || 0) < 45 && Math.random() < 0.3) {
      return null; // Phiếu trắng
    }

    return highestSuspect.id;
  }
}
