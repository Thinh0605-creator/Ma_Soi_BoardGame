// engine.js - Lõi vận hành Game Ma Sói (Werewolf Game Engine)

import { ROLES, BOT_NAMES } from './roles.js';
import { BotAI } from './bot-ai.js';
import { OfflineBrain } from './offline-brain.js';
import { SocialMind } from './social-mind.js';

export class WerewolfEngine {
  constructor() {
    this.botAI = new BotAI(this);
    this.offline = new OfflineBrain(this);
    this.social = new SocialMind(this);
    this.reset();
  }

  reset() {
    this.players = [];
    this.social?.reset();
    this.offline?.reset();
    this.timing = this.timing || {discussion:180, nomination:90, defense:45, voting:30, threshold:20};
    this.trialVoteRule = this.trialVoteRule || 'supermajority';
    this.stageDeadline = null;
    this.discussionQueue = [];
    this.speechPaceMs = this.speechPaceMs || 12000;
    this.debatePaused = false;
    this.lastBotTexts = [];
    this.discussionWorker = false;
    this.discussionBusy = false;
    this.discussionSpoken = new Map();
    this.stageToken = (this.stageToken || 0) + 1;
    this.phase = 'setup'; // 'setup', 'night', 'day_discussion', 'day_voting', 'day_execution', 'hunter_revenge', 'game_over'
    this.dayNumber = 0;
    this.logs = [];
    this.chatMessages = [];
    this.currentNightActions = {}; // { roleActionKey: targetData }
    this.lastNightDeaths = [];
    this.wolfVictimId = null;
    this.wolfExtraKills = 0; // Khi Sói con bị treo
    this.elderLostSkills = false; // Khi Già làng bị treo oan
    this.silverKnightPendingWolf = null; // Sói bên trái Kị sĩ giáp bạc
    this.winner = null; // 'villagers', 'werewolves', 'fool', 'lovers', 'serial_killer', 'cult'
    this.winReason = '';
    this.activeStoryHint = null;
    this.listeners = this.listeners || []; // giữ nguyên listener của UI khi reset ván mới
    this.sessionId = (this.sessionId || 0) + 1;
  }

  // Đăng ký listener cập nhật UI
  subscribe(fn) {
    this.listeners.push(fn);
  }

  emitChange() {
    this.listeners.forEach(fn => fn(this));
  }

  addLog(type, text, icon = '📜') {
    const logItem = {
      id: Date.now() + Math.random(),
      type, // 'system', 'night', 'death', 'vote', 'info', 'win'
      text,
      icon,
      day: this.dayNumber,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    this.logs.unshift(logItem);
    this.emitChange();
  }

  addChatMessage(senderPlayer, text, isSystem = false) {
    const msg = {
      id: Date.now() + Math.random(),
      senderId: senderPlayer ? senderPlayer.id : 'system',
      senderName: senderPlayer ? senderPlayer.name : 'Quản Trò',
      senderAvatar: senderPlayer ? senderPlayer.avatar : '🎙️',
      senderRole: senderPlayer ? senderPlayer.role : null,
      text,
      isSystem,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    this.chatMessages.push(msg);
    if (!isSystem) this.social?.observe(senderPlayer, text);
    this.emitChange();
  }

  getPlayer(id) {
    return this.players.find(p => p.id === id);
  }

  getAlivePlayers() {
    return this.players.filter(p => p.isAlive);
  }

  getAliveWolves() {
    return this.players.filter(p => p.isAlive && p.team === 'werewolf');
  }

  getHumanPlayer() {
    return this.players.find(p => p.isHuman);
  }

  // ==========================================
  // KHỞI TẠO PHÒNG CHƠI
  // ==========================================
  setupGame(selectedRoleKeys, humanRoleKey = null, humanName = 'Bạn') {
    this.reset();

    // Trộn ngẫu nhiên tên Bot
    const shuffledBotNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);

    // Xác định vai của người chơi
    let roleKeys = [...selectedRoleKeys];
    let humanRole = humanRoleKey;
    if (!humanRole) {
      // Chọn ngẫu nhiên 1 vai trong danh sách cho người chơi
      humanRole = roleKeys[Math.floor(Math.random() * roleKeys.length)];
    }

    // Loại bỏ 1 vai dành cho người chơi và gán các vai còn lại cho Bot
    const humanRoleIndex = roleKeys.indexOf(humanRole);
    if (humanRoleIndex > -1) {
      roleKeys.splice(humanRoleIndex, 1);
    } else {
      // Trường hợp hi hữu
      humanRole = roleKeys.pop();
    }

    // Trộn ngẫu nhiên các vai của bot
    roleKeys.sort(() => Math.random() - 0.5);

    // Tạo Người chơi Thật (User)
    const humanPlayer = {
      id: 'p_human',
      name: humanName || 'Bạn',
      avatar: '🤠',
      isHuman: true,
      role: humanRole,
      roleData: ROLES[humanRole],
      team: ROLES[humanRole].team,
      isAlive: true,
      isFrozen: false,
      isNightmared: false,
      isIllusioned: false,
      isInfected: false,
      isCultMember: false,
      isProtected: false,
      lovedOneId: null,
      elderArmor: humanRole === 'ELDER' ? 1 : 0,
      hasHealPotion: humanRole === 'WITCH',
      hasPoisonPotion: humanRole === 'WITCH',
      cleansePotions: humanRole === 'ALCHEMIST' ? 2 : 0,
      specialAbilityUsed: false,
      specialAbilityLost: false,
      doppelTargetId: null,
      avengerTargetId: null,
      parasiteHostId: null,
      lastProtectedId: null,
      votesCount: 0
    };

    // Tạo các Bot
    const botPlayers = roleKeys.map((roleKey, idx) => {
      const botProfile = shuffledBotNames[idx % shuffledBotNames.length];
      return {
        id: `p_bot_${idx + 1}`,
        name: botProfile.name,
        avatar: botProfile.avatar,
        trait: botProfile.trait,
        isHuman: false,
        role: roleKey,
        roleData: ROLES[roleKey],
        team: ROLES[roleKey].team,
        isAlive: true,
        isFrozen: false,
        isNightmared: false,
        isIllusioned: false,
        isInfected: false,
        isCultMember: false,
        isProtected: false,
        lovedOneId: null,
        elderArmor: roleKey === 'ELDER' ? 1 : 0,
        hasHealPotion: roleKey === 'WITCH',
        hasPoisonPotion: roleKey === 'WITCH',
        cleansePotions: roleKey === 'ALCHEMIST' ? 2 : 0,
        specialAbilityUsed: false,
        specialAbilityLost: false,
        doppelTargetId: null,
        avengerTargetId: null,
        parasiteHostId: null,
        lastProtectedId: null,
        votesCount: 0
      };
    });

    // Gom tất cả người chơi và xếp thành vòng tròn (vị trí ngẫu nhiên quanh lửa trại)
    this.players = [humanPlayer, ...botPlayers].sort(() => Math.random() - 0.5);

    // Gán index vị trí ngồi cho từng người chơi để tính khoảng cách & vai Kị sĩ giáp bạc
    this.players.forEach((p, idx) => {
      p.seatIndex = idx;
    });

    this.addLog('system', `Trò chơi bắt đầu với ${this.players.length} người chơi. Bạn là ${humanPlayer.roleData.name}!`, '🎮');
    this.addChatMessage(null, `Chào mừng toàn thể dân làng! Đêm nay là Đêm thứ nhất, xin mời mọi người đi ngủ nhắm mắt lại...`, true);

    this.startNight();
  }

  // ==========================================
  // BẮT ĐẦU ĐÊM (START NIGHT)
  // ==========================================
  startNight() {
    this.dayNumber += 1;
    this.phase = 'night';
    ++this.stageToken; this.stageDeadline = null;
    this.currentNightActions = {};
    this.lastNightDeaths = [];
    this.wolfVictimId = null;

    // Reset các trạng thái tạm thời trong đêm
    this.players.forEach(p => {
      p.isFrozen = false;
      p.isNightmared = false;
      p.isIllusioned = false;
      p.isProtected = false;
    });

    this.addLog('night', `Trăng lên! Đêm thứ ${this.dayNumber} bắt đầu. Hãy cẩn trọng trước nanh vuốt bóng đêm.`, '🌙');
    this.addChatMessage(null, `Trời đã tối, mọi người đi ngủ nhắm mắt lại... Các linh hồn và bóng ma đêm bắt đầu thức tỉnh!`, true);

    // Tạo context đêm
    this.nightContext = {
      day: this.dayNumber,
      wolfVictimId: null,
      witchHealedId: null,
      witchPoisonedId: null
    };

    // Tự động giải quyết các hành động đêm của Bot
    this.resolveBotNightActions();
    this.emitChange();

    // Người chơi đã chết (khán giả) -> không ai bấm nút, game tự chạy tiếp
    if (this.isHumanSpectator()) {
      const session = this.sessionId;
      const night = this.dayNumber;
      setTimeout(() => {
        if (session === this.sessionId && this.phase === 'night' && this.dayNumber === night) this.resolveNight();
      }, 3000);
    }
  }

  // Người chơi đã chết hoặc không còn trong ván -> chỉ xem
  isHumanSpectator() {
    const human = this.getHumanPlayer();
    return !human || !human.isAlive;
  }

  // Bot thực hiện hành động đêm
  resolveBotNightActions() {
    const aliveBots = this.players.filter(p => !p.isHuman && p.isAlive);

    // 1. Bot Sói thống nhất con mồi
    const wolfBots = aliveBots.filter(p => p.team === 'werewolf');
    this.currentNightActions['WOLF_BOT_VOTES'] = {};
    if (wolfBots.length > 0) {
      const votes = {};
      wolfBots.forEach(w => {
        const targetId = this.botAI.decideNightAction(w);
        if (targetId) {
          votes[targetId] = (votes[targetId] || 0) + 1;
          this.currentNightActions['WOLF_BOT_VOTES'][w.id] = targetId;
        }
      });

      // Lấy mục tiêu có nhiều phiếu nhất từ đàn sói; nếu hòa thì bốc ngẫu nhiên trong số đó
      const maxVotes = Math.max(0, ...Object.values(votes));
      const leaders = Object.keys(votes).filter(id => votes[id] === maxVotes);
      const chosenTarget = leaders.length > 0 ? leaders[Math.floor(Math.random() * leaders.length)] : null;
      this.currentNightActions['WOLF_KILL'] = chosenTarget;
      this.nightContext.wolfVictimId = chosenTarget;
    }

    // 2. Các Bot vai trò khác hành động
    aliveBots.forEach(bot => {
      if (bot.team === 'werewolf' && bot.role === 'WEREWOLF') return; // Đã vote chung

      const action = this.botAI.decideNightAction(bot);
      if (action !== null && action !== undefined) {
        this.currentNightActions[`${bot.role}_${bot.id}`] = action;
      }
    });
  }

  // Người chơi nộp hành động đêm của mình
  submitHumanNightAction(actionType, targetId, secondaryTargetId = null) {
    const human = this.getHumanPlayer();
    if (!human || !human.isAlive) return;

    if (this.phase !== 'night') return;
    if (actionType === 'WOLF_KILL') {
      // Người chơi góp phiếu cắn cùng đàn sói
      const wolfVotes = this.currentNightActions['WOLF_VOTES'] || {};
      wolfVotes[human.id] = targetId;
      this.currentNightActions['WOLF_VOTES'] = wolfVotes;
      const botVotes = this.currentNightActions['WOLF_BOT_VOTES'] || {};
      const tally = {};
      for (const v of Object.values({...botVotes, ...wolfVotes})) if (v) tally[v] = (tally[v] || 0) + 1;
      const max = Math.max(0, ...Object.values(tally));
      const leaders = Object.keys(tally).filter(k => tally[k] === max);
      // Hòa phiếu: ưu tiên lựa chọn của người chơi (sói thật), nếu không có thì bốc ngẫu nhiên
      this.currentNightActions['WOLF_KILL'] = leaders.includes(targetId) ? targetId : leaders[Math.floor(Math.random() * leaders.length)];
      this.nightContext.wolfVictimId = this.currentNightActions['WOLF_KILL'];
    } else {
      this.currentNightActions[`${human.role}_${human.id}`] = (targetId && typeof targetId === 'object' && !Array.isArray(targetId)) ? targetId : { targetId, secondaryTargetId };
      if (actionType === 'SEER') this.currentNightActions[`SEER_${human.id}`] = {targetId};
    }

    this.addLog('info', `Bạn đã chọn mục tiêu cho kỹ năng của mình trong đêm.`, '✨');
    this.resolveNight();
  }

  // ==========================================
  // GIẢI QUYẾT TOÀN BỘ KỸ NĂNG ĐÊM (RESOLVE NIGHT)
  // ==========================================
  resolveNight() {
    const human = this.getHumanPlayer();
    const deaths = [];

    // --- BƯỚC 1: Cupid ghép đôi (Đêm 1) ---
    if (this.dayNumber === 1) {
      const cupidAction = this.findActionByRole('CUPID');
      if (cupidAction) {
        let p1Id, p2Id;
        if (Array.isArray(cupidAction)) {
          [p1Id, p2Id] = cupidAction;
        } else if (cupidAction.targetId && cupidAction.secondaryTargetId) {
          p1Id = cupidAction.targetId;
          p2Id = cupidAction.secondaryTargetId;
        }
        if (p1Id && p2Id) {
          const p1 = this.getPlayer(p1Id);
          const p2 = this.getPlayer(p2Id);
          if (p1 && p2) {
            p1.lovedOneId = p2.id;
            p2.lovedOneId = p1.id;
            this.addLog('night', `Thần Tình Yêu đã se duyên kết nối hai trái tim của làng!`, '💘');
            if (human.id === p1Id || human.id === p2Id) {
              const lover = human.id === p1Id ? p2 : p1;
              this.addLog('info', `Bạn và ${lover.name} đã trở thành Cặp Tình Nhân định mệnh! Hãy cùng nhau bảo vệ đối phương.`, '💖');
            }
          }
        }
      }

      // Kẻ Biến Hình (Doppelgänger) Đêm 1
      const doppelAction = this.findActionByRole('DOPPELGANGER');
      if (doppelAction) {
        const doppelPlayer = this.players.find(p => p.role === 'DOPPELGANGER');
        const targetId = typeof doppelAction === 'string' ? doppelAction : doppelAction.targetId;
        if (doppelPlayer && targetId) {
          doppelPlayer.doppelTargetId = targetId;
        }
      }

      // Kẻ Ký Sinh (Parasite) Đêm 1
      const parasiteAction = this.findActionByRole('PARASITE');
      if (parasiteAction) {
        const parasitePlayer = this.players.find(p => p.role === 'PARASITE');
        const targetId = typeof parasiteAction === 'string' ? parasiteAction : parasiteAction.targetId;
        if (parasitePlayer && targetId) {
          parasitePlayer.parasiteHostId = targetId;
        }
      }
    }

    // --- BƯỚC 2: Sói Ác Mộng & Sói Băng Giá (Khống chế sớm) ---
    const nightmareAction = this.findActionByRole('NIGHTMARE_WOLF');
    if (nightmareAction) {
      const targetId = typeof nightmareAction === 'string' ? nightmareAction : nightmareAction.targetId;
      const target = this.getPlayer(targetId);
      if (target) target.isNightmared = true;
    }

    const frostAction = this.findActionByRole('FROST_WOLF');
    if (frostAction) {
      const targetId = typeof frostAction === 'string' ? frostAction : frostAction.targetId;
      const target = this.getPlayer(targetId);
      if (target) target.isFrozen = true;
    }

    // --- BƯỚC 3: Nhà Giả Kim giải trừ trạng thái ---
    const alchemistAction = this.findActionByRole('ALCHEMIST');
    if (alchemistAction) {
      const targetId = typeof alchemistAction === 'string' ? alchemistAction : alchemistAction.targetId;
      const target = this.getPlayer(targetId);
      if (target) {
        target.isFrozen = false;
        target.isNightmared = false;
        target.isInfected = false;
      }
    }

    // --- BƯỚC 4: Bảo Vệ (Bodyguard) che chở ---
    const protectAction = this.findActionByRole('BODYGUARD');
    let protectedPlayerId = null;
    if (protectAction) {
      const bodyguard = this.players.find(p => p.role === 'BODYGUARD');
      if (bodyguard && !bodyguard.isNightmared && !bodyguard.isFrozen) {
        protectedPlayerId = typeof protectAction === 'string' ? protectAction : protectAction.targetId;
        const target = this.getPlayer(protectedPlayerId);
        if (target) {
          target.isProtected = true;
          bodyguard.lastProtectedId = protectedPlayerId;
        }
      }
    }

    // --- BƯỚC 5: Đàn Sói Cắn ---
    const wolfKillTargetId = this.currentNightActions['WOLF_KILL'];
    let wolfVictim = this.getPlayer(wolfKillTargetId);

    // Kiểm tra Sói Chúa nhiễm hóa thay vì cắn
    const alphaInfectAction = this.findActionByRole('ALPHA_WOLF');
    let alphaInfected = false;
    if (alphaInfectAction) {
      const alphaWolf = this.players.find(p => p.role === 'ALPHA_WOLF');
      if (alphaWolf && !alphaWolf.specialAbilityUsed) {
        const infectTargetId = typeof alphaInfectAction === 'string' ? alphaInfectAction : alphaInfectAction.targetId;
        if (infectTargetId === wolfKillTargetId && wolfVictim && !wolfVictim.isProtected) {
          wolfVictim.team = 'werewolf';
          alphaWolf.specialAbilityUsed = true;
          alphaInfected = true;
          this.addLog('night', `Một tiếng gầm u ám vọng lên... Một linh hồn đã bị đồng hóa vào đàn Sói!`, '👑🐺');
        }
      }
    }

    // Nếu không bị nhiễm hóa và có mục tiêu bị cắn
    let wolfKilled = null;
    if (wolfVictim && !alphaInfected) {
      if (wolfVictim.isProtected) {
        this.addLog('night', `Lá chắn dũng cảm của Bảo Vệ đã đẩy lùi nanh vuốt bầy Sói trong đêm!`, '🛡️');
      } else if (wolfVictim.role === 'ELDER' && wolfVictim.elderArmor > 0) {
        wolfVictim.elderArmor -= 1;
        this.addLog('night', `Già Làng đã dùng tấm thân dạn dày phong ba chống đỡ đòn cắn ác hiểm của bầy Sói!`, '👴');
      } else {
        wolfKilled = wolfVictim;
      }
    }

    // Sói Dịch Bệnh (Plague Wolf) gieo bệnh
    const plagueAction = this.findActionByRole('PLAGUE_WOLF');
    if (plagueAction) {
      const targetId = typeof plagueAction === 'string' ? plagueAction : plagueAction.targetId;
      const target = this.getPlayer(targetId);
      if (target) target.isInfected = true;
    }

    // Sói Trắng (White Werewolf) giết sói khác vào đêm chẵn
    if (this.dayNumber % 2 === 0) {
      const whiteWolfAction = this.findActionByRole('WHITE_WEREWOLF');
      if (whiteWolfAction) {
        const targetId = typeof whiteWolfAction === 'string' ? whiteWolfAction : whiteWolfAction.targetId;
        const target = this.getPlayer(targetId);
        if (target && target.isAlive && target.team === 'werewolf') {
          deaths.push({ player: target, reason: 'Sói Trắng cắn xé nội bộ' });
        }
      }
    }

    // --- BƯỚC 6: Sát Nhân Hàng Loạt (Serial Killer) ---
    const skAction = this.findActionByRole('SERIAL_KILLER');
    if (skAction) {
      const skPlayer = this.players.find(p => p.role === 'SERIAL_KILLER');
      if (skPlayer && skPlayer.isAlive && !skPlayer.isNightmared && !skPlayer.isFrozen) {
        const targetId = typeof skAction === 'string' ? skAction : skAction.targetId;
        const target = this.getPlayer(targetId);
        if (target && target.isAlive) {
          deaths.push({ player: target, reason: 'vết dao sắc nhọn của Sát Nhân Hàng Loạt' });
        }
      }
    }

    // --- BƯỚC 7: Phù Thủy (Cứu / Độc) ---
    const witchAction = this.findActionByRole('WITCH');
    if (witchAction) {
      const witch = this.players.find(p => p.role === 'WITCH');
      if (witch && witch.isAlive && !witch.isNightmared && !witch.isFrozen && !this.elderLostSkills) {
        // Cứu
        if (witchAction.healTargetId && witch.hasHealPotion) {
          if (wolfKilled && wolfKilled.id === witchAction.healTargetId) {
            wolfKilled = null;
            witch.hasHealPotion = false;
            this.addLog('night', `Lọ thuốc hồi sinh của Phù Thủy đã kéo một nạn nhân trở về từ cõi chết!`, '🧪');
          }
        }
        // Độc
        if (witchAction.poisonTargetId && witch.hasPoisonPotion) {
          const poisonedTarget = this.getPlayer(witchAction.poisonTargetId);
          if (poisonedTarget && poisonedTarget.isAlive) {
            witch.hasPoisonPotion = false;
            deaths.push({ player: poisonedTarget, reason: 'lọ độc dược tím của Phù Thủy' });
          }
        }
      }
    }

    // Nếu bầy sói cắn thành công sau bước phù thủy
    if (wolfKilled) {
      deaths.push({ player: wolfKilled, reason: 'nanh vuốt của bầy Sói hung ác' });
    }

    // --- BƯỚC 8: Mục Sư (Nước Thánh) ---
    const priestAction = this.findActionByRole('PRIEST');
    if (priestAction) {
      const priest = this.players.find(p => p.role === 'PRIEST');
      if (priest && !priest.specialAbilityUsed && !this.elderLostSkills) {
        const targetId = typeof priestAction === 'string' ? priestAction : priestAction.targetId;
        const target = this.getPlayer(targetId);
        priest.specialAbilityUsed = true;
        if (target && (target.team === 'werewolf' || target.role === 'SERIAL_KILLER')) {
          deaths.push({ player: target, reason: 'bình Nước Thánh thiêng liêng của Mục Sư' });
          this.addLog('night', `Nước Thánh đã thiêu đốt một kẻ ác tà trong đêm!`, '✝️');
        }
      }
    }

    // --- BƯỚC 9: Bác Sĩ (Chữa mầm bệnh) ---
    const doctorAction = this.findActionByRole('DOCTOR');
    if (doctorAction) {
      const doctor = this.players.find(p => p.role === 'DOCTOR');
      if (doctor && doctor.isAlive && !this.elderLostSkills) {
        const targetId = typeof doctorAction === 'string' ? doctorAction : doctorAction.targetId;
        const target = this.getPlayer(targetId);
        if (target && target.isInfected) {
          target.isInfected = false;
        }
      }
    }

    // --- BƯỚC 10: Giáo Chủ (Cult Leader) truyền đạo ---
    const cultAction = this.findActionByRole('CULT_LEADER');
    if (cultAction) {
      const cultLeader = this.players.find(p => p.role === 'CULT_LEADER');
      if (cultLeader && cultLeader.isAlive && !cultLeader.isNightmared && !cultLeader.isFrozen) {
        const targetId = typeof cultAction === 'string' ? cultAction : cultAction.targetId;
        const target = this.getPlayer(targetId);
        if (target) {
          target.isCultMember = true;
          if (target.isHuman) {
            this.addLog('info', `Bạn đã được Giáo Chủ truyền đạo và gia nhập Giáo Phái Tối Thượng!`, '🛐');
          }
        }
      }
    }

    // --- BƯỚC 11: Soi Phe (Tiên Tri, Cáo, Thám Tử) ---
    this.processInvestigationSkills();

    // --- BƯỚC 12: Xử lý hiệu ứng chết dây chuyền ---
    this.processNightDeaths(deaths);
  }

  // Xử lý các kỹ năng điều tra soi đêm
  processInvestigationSkills() {
    const human = this.getHumanPlayer();

    // 1. Tiên Tri
    const seerAction = this.findActionByRole('SEER') || this.findActionByRole('APPRENTICE_SEER');
    if (seerAction) {
      const seer = this.players.find(p => (p.role === 'SEER' || (p.role === 'APPRENTICE_SEER' && p.isSeerAwakened)) && p.isAlive);
      if (seer && !seer.isNightmared && !this.elderLostSkills) {
        const targetId = typeof seerAction === 'string' ? seerAction : seerAction.targetId;
        const target = this.getPlayer(targetId);
        if (target) {
          // Tính kết quả soi (tính đến Sói Ảo Ảnh & Bán Sói)
          let detectedTeam = target.team;
          if (target.isIllusioned) detectedTeam = 'villager';
          if (target.role === 'LYCAN') detectedTeam = 'werewolf';

          const teamLabel = detectedTeam === 'werewolf' ? 'PHE SÓI 🐺' : (detectedTeam === 'neutral' ? 'PHE ĐỘC LẬP 🎭' : 'PHE DÂN LÀNG 👨‍🌾');

          if (seer.isHuman) {
            this.addLog('info', `Quả cầu Tiên Tri phát sáng: Người chơi [${target.name}] thuộc [${teamLabel}]!`, '🔮');
          } else {
            seer.aiMemory.knownRoles[target.id] = (detectedTeam === 'werewolf') ? 'WEREWOLF' : 'VILLAGER';
            seer.aiMemory.suspicions[target.id] = (detectedTeam === 'werewolf') ? 100 : 0;
          }
        }
      }
    }

    // 2. Thám Tử
    const detAction = this.findActionByRole('DETECTIVE');
    if (detAction) {
      const detective = this.players.find(p => p.role === 'DETECTIVE' && p.isAlive);
      if (detective && !detective.isNightmared && !this.elderLostSkills) {
        let p1Id, p2Id;
        if (Array.isArray(detAction)) {
          [p1Id, p2Id] = detAction;
        } else if (detAction.targetId && detAction.secondaryTargetId) {
          p1Id = detAction.targetId;
          p2Id = detAction.secondaryTargetId;
        }

        if (p1Id && p2Id) {
          const p1 = this.getPlayer(p1Id);
          const p2 = this.getPlayer(p2Id);
          if (p1 && p2) {
            const sameTeam = p1.team === p2.team;
            if (detective.isHuman) {
              this.addLog('info', `Kính lúp Thám Tử hé lộ: [${p1.name}] và [${p2.name}] là ${sameTeam ? 'CÙNG PHE ✅' : 'KHÁC PHE ❌'}!`, '🔍');
            }
          }
        }
      }
    }

    // 3. Cáo
    const foxAction = this.findActionByRole('FOX');
    if (foxAction) {
      const fox = this.players.find(p => p.role === 'FOX' && p.isAlive && !p.specialAbilityLost);
      if (fox && !fox.isNightmared && !this.elderLostSkills) {
        const centerId = typeof foxAction === 'string' ? foxAction : foxAction.targetId;
        const center = this.getPlayer(centerId);
        if (center) {
          // Lấy cụm 3 người ngồi cạnh nhau
          const alive = this.getAlivePlayers();
          const cIdx = alive.findIndex(p => p.id === center.id);
          const left = alive[(cIdx - 1 + alive.length) % alive.length];
          const right = alive[(cIdx + 1) % alive.length];
          const group = [left, center, right];

          const hasWolf = group.some(p => p.team === 'werewolf' && !p.isIllusioned);
          if (fox.isHuman) {
            if (hasWolf) {
              this.addLog('info', `Chiếc mũi nhạy bén của Cáo ngửi thấy: Trong cụm [${left.name}, ${center.name}, ${right.name}] CÓ ÍT NHẤT 1 SÓI!`, '🦊');
            } else {
              fox.specialAbilityLost = true;
              this.addLog('info', `Cả 3 người [${left.name}, ${center.name}, ${right.name}] đều trong sạch! Cáo đã mất khứu giác vĩnh viễn.`, '🦊');
            }
          } else {
            if (!hasWolf) fox.specialAbilityLost = true;
          }
        }
      }
    }
  }

  // Xử lý các cái chết và hiệu ứng dây chuyền
  processNightDeaths(initialDeaths) {
    // Loại trừ các bản ghi trùng lặp
    const uniqueDeaths = [];
    const deadIds = new Set();

    initialDeaths.forEach(d => {
      if (d.player && d.player.isAlive && !deadIds.has(d.player.id)) {
        deadIds.add(d.player.id);
        uniqueDeaths.push(d);
      }
    });

    // Thực hiện cái chết
    uniqueDeaths.forEach(d => {
      d.player.isAlive = false;
      this.addLog('death', `[${d.player.name}] đã gục ngã trong đêm!`, '💀');
    });

    // 1. Kị Sĩ Giáp Bạc (Silver Knight) kéo theo Sói bên trái
    uniqueDeaths.forEach(d => {
      if (d.player.role === 'SILVER_KNIGHT' && d.reason.includes('bầy Sói')) {
        const allSeats = [...this.players].sort((a, b) => a.seatIndex - b.seatIndex);
        const kIdx = allSeats.findIndex(p => p.id === d.player.id);
        // Tìm con Sói còn sống gần nhất bên tay trái (chỉ số giảm dần hoặc vòng tròn)
        for (let i = 1; i < allSeats.length; i++) {
          const neighbor = allSeats[(kIdx - i + allSeats.length) % allSeats.length];
          if (neighbor.isAlive && neighbor.team === 'werewolf') {
            this.silverKnightPendingWolf = neighbor.id;
            this.addLog('night', `Gươm bạc của Kị Sĩ đã chém trúng ${neighbor.name}, chất độc tẩm bạc sẽ phát tác vào đêm kế!`, '🗡️');
            break;
          }
        }
      }
    });

    // 2. Kẻ Biến Hình (Doppelgänger) kế thừa vai
    uniqueDeaths.forEach(d => {
      const doppel = this.players.find(p => p.role === 'DOPPELGANGER' && p.isAlive);
      if (doppel && doppel.doppelTargetId === d.player.id) {
        doppel.role = d.player.role;
        doppel.roleData = d.player.roleData;
        doppel.team = d.player.team;
        this.addLog('night', `Kẻ Biến Hình đã thức tỉnh và đoạt lấy linh hồn, thừa kế vai trò [${d.player.roleData.name}]!`, '🪞');
      }
    });

    // 3. Tiên Tri Tập Sự (Apprentice Seer) thức tỉnh
    uniqueDeaths.forEach(d => {
      if (d.player.role === 'SEER') {
        const apprentice = this.players.find(p => p.role === 'APPRENTICE_SEER' && p.isAlive);
        if (apprentice) {
          apprentice.isSeerAwakened = true;
          this.addLog('night', `Tiên Tri Tập Sự đã kế thừa thiên nhãn từ Tiên Tri quá cố!`, '📜👁️');
        }
      }
    });

    // 4. Cặp Tình Nhân chết chùm
    uniqueDeaths.forEach(d => {
      if (d.player.lovedOneId) {
        const lover = this.getPlayer(d.player.lovedOneId);
        if (lover && lover.isAlive) {
          lover.isAlive = false;
          this.addLog('death', `Vì nỗi đau mất đi người yêu dấu, [${lover.name}] đã qua đời!`, '💔');
        }
      }
    });

    this.lastNightDeaths = uniqueDeaths.map(d => d.player);

    // Kiểm tra xem Thợ Săn có hy sinh đêm nay không
    const hunterDied = uniqueDeaths.find(d => d.player.role === 'HUNTER');
    if (hunterDied && !this.elderLostSkills) {
      this.triggerHunterRevenge(hunterDied.player);
      return;
    }

    // Chuyển sang Ban Ngày
    this.startDay();
  }

  // Kích hoạt phát bắn của Thợ Săn
  triggerHunterRevenge(hunterPlayer) {
    this.phase = 'hunter_revenge';
    this.pendingHunter = hunterPlayer;

    this.addLog('death', `[${hunterPlayer.name}] là Thợ Săn! Trong hơi thở cuối cùng, anh ta đang nhắm họng súng vào một kẻ khả nghi...`, '🏹');
    this.addChatMessage(null, `TIẾNG SÚNG THỢ SĂN! Trước khi trút hơi thở cuối cùng, Thợ Săn sẽ kéo theo một kẻ xuống mồ!`, true);

    if (hunterPlayer.isHuman) {
      // Đợi người chơi chọn mục tiêu bắn
      this.emitChange();
    } else {
      // Bot Thợ Săn tự động bắn kẻ có điểm nghi ngờ cao nhất
      setTimeout(() => {
        const alive = this.getAlivePlayers();
        if (alive.length > 0) {
          alive.sort((a, b) => (hunterPlayer.aiMemory?.suspicions[b.id] || 0) - (hunterPlayer.aiMemory?.suspicions[a.id] || 0));
          const target = alive[0];
          this.executeHunterShot(target.id);
        } else {
          this.startDay();
        }
      }, 1500);
    }
  }

  executeHunterShot(targetId) {
    const target = this.getPlayer(targetId);
    if (target && target.isAlive) {
      target.isAlive = false;
      this.addLog('death', `Đoàng! Một người đã bị bắn gục: [${target.name}]!`, '🎯');

      // Tình nhân chết theo nếu có
      if (target.lovedOneId) {
        const lover = this.getPlayer(target.lovedOneId);
        if (lover && lover.isAlive) {
          lover.isAlive = false;
          this.addLog('death', `[${lover.name}] tự vẫn chết theo người yêu bị Thợ Săn bắn!`, '💔');
        }
      }
    }
    this.pendingHunter = null;
    this.startDay();
  }

  // ==========================================
  // BẮT ĐẦU BAN NGÀY (START DAY)
  // ==========================================
  startDay() {
    // Kiểm tra điều kiện thắng trước
    if (this.checkWinCondition()) return;

    this.phase = 'day_discussion';
    this.addLog('system', `Mặt trời mọc! Ngày thứ ${this.dayNumber} bắt đầu. Dân làng tụ họp tại quảng trường.`, '☀️');

    if (this.lastNightDeaths.length === 0) {
      this.addChatMessage(null, `Trời đã sáng! Thật kỳ diệu, đêm qua không có bất kỳ ai phải ngã xuống. Toàn làng bình yên vô sự!`, true);
    } else {
      const names = this.lastNightDeaths.map(p => `[${p.name}]`).join(', ');
      this.addChatMessage(null, `Trời đã sáng! Đêm kinh hoàng vừa qua đã cướp đi sinh mạng của: ${names}. Xin chia buồn cùng làng!`, true);
    }

    // Người Kể Chuyện (Storyteller) kể chuyện nếu còn sống (từ ngày 2)
    if (this.dayNumber >= 2) {
      const storyteller = this.players.find(p => p.role === 'STORYTELLER' && p.isAlive);
      if (storyteller) {
        this.triggerStorytellerHint();
      }
    }

    // Bot tự động mở lời thảo luận
    this.triggerBotDiscussions();
    this.emitChange();

    // Hết thời gian thảo luận: tự chuyển sang đề cử, kể cả khi người chơi còn sống.
    this.setStageTimer(this.timing.discussion, () => this.startNomination());
    if (false && this.isHumanSpectator()) {
      const session = this.sessionId;
      const day = this.dayNumber;
      setTimeout(() => {
        if (session === this.sessionId && this.phase === 'day_discussion' && this.dayNumber === day) this.startVoting();
      }, 9000);
    }
  }

  // Người kể chuyện đưa ra gợi ý khách quan
  triggerStorytellerHint() {
    const alive = this.getAlivePlayers();
    if (alive.length >= 3) {
      const shuffled = [...alive].sort(() => Math.random() - 0.5);
      const triplet = shuffled.slice(0, 3);
      const wolfInTriplet = triplet.some(p => p.team === 'werewolf');
      this.activeStoryHint = {
        names: triplet.map(p => p.name).join(', '),
        hasWolf: wolfInTriplet
      };
      this.addChatMessage(null, `[Chuyện Ngụ Ngôn Của Người Kể Chuyện]: "Trong 3 cái tên [${this.activeStoryHint.names}], ${wolfInTriplet ? 'có ít nhất một kẻ mang dã tâm bóng tối của loài Sói!' : 'tất cả họ đều giữ tấm lòng trong sạch trước thần linh.'}"`, true);
    }
  }

  // Continuous, single-worker dialogue scheduler. Human replies take priority.
  queueBotSpeech(bot, kind = 'discussion', userText = '') {
    if (!bot?.isAlive || this.phase !== 'day_discussion') return;
    const item = {bot, kind, userText};
    if (kind === 'reply') {
      this.discussionQueue = this.discussionQueue.filter(x => !(x.bot.id === bot.id && x.kind === 'discussion'));
      this.discussionQueue.unshift(item);
    } else if (!this.discussionQueue.some(x => x.bot.id === bot.id)) {
      this.discussionQueue.push(item);
    }
    void this.runDiscussionWorker();
  }

  async botSpeak(bot, kind = 'discussion', userText = '') {
    if (!['day_discussion', 'day_defense'].includes(this.phase) || !bot.isAlive) return false;
    if (kind === 'defense' && this.phase !== 'day_defense') return false;
    const session = this.sessionId, day = this.dayNumber, phase = this.phase;
    this.botAI.initBotMemory(bot);
    const plan = this.social.plan(bot, kind, userText);
    const generated = this.offline.speak(bot, kind, userText);
    if (this.phase !== phase || this.sessionId !== session || this.dayNumber !== day || !bot.isAlive) return false;
    if (generated) {
      const norm = generated.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
      const recent = this.lastBotTexts.slice(-16);
      const words = new Set(norm.split(' ').filter(w=>w.length>3));
      const duplicate = recent.some(prev => {
        if (prev === norm) return true;
        const other = new Set(prev.split(' ').filter(w=>w.length>3));
        const common = [...words].filter(w=>other.has(w)).length;
        return words.size>=7 && common/Math.max(words.size,other.size)>.83;
      });
      if (duplicate) return false;
      this.lastBotTexts.push(norm);
      if (this.lastBotTexts.length>40) this.lastBotTexts.shift();
      this.aiNotice = '';
      this.addChatMessage(bot, generated);
      this.social.rememberSpeech(bot, generated, plan);
      return true;
    }
    this.aiNotice = 'Bot offline không tạo được lời thoại.';
    this.emitChange();
    return false;
  }

  async runDiscussionWorker() {
    if (this.discussionWorker) return;
    this.discussionWorker = true;
    const session = this.sessionId, day = this.dayNumber;
    try {
      while (this.phase === 'day_discussion' && session === this.sessionId && day === this.dayNumber) {
        if (this.debatePaused) { await new Promise(resolve => setTimeout(resolve, 300)); continue; }
        const bots = this.players.filter(p => !p.isHuman && p.isAlive);
        if (!bots.length) break;
        if (!this.discussionQueue.length) {
          const candidates = [...bots].sort((a,b) =>
            (this.discussionSpoken.get(a.id)||0) - (this.discussionSpoken.get(b.id)||0) || Math.random()-.5);
          this.discussionQueue.push({bot:candidates[0],kind:'discussion',userText:''});
        }
        const next = this.discussionQueue.shift();
        if (!next?.bot.isAlive) continue;
        this.discussionBusy = true;
        this.emitChange();
        const succeeded = await this.botSpeak(next.bot,next.kind,next.userText);
        this.discussionBusy = false;
        if (session !== this.sessionId || day !== this.dayNumber || this.phase !== 'day_discussion') break;
        if (succeeded) this.discussionSpoken.set(next.bot.id,(this.discussionSpoken.get(next.bot.id)||0)+1);
        // If API fails, avoid an endless tight loop of requests.
        if (!succeeded) {
          await new Promise(resolve => setTimeout(resolve, Math.min(this.speechPaceMs || 12000, 5000)));
        } else {
          await new Promise(resolve => setTimeout(resolve, this.speechPaceMs || 12000));
        }
      }
    } finally {
      this.discussionBusy = false;
      this.discussionWorker = false;
      this.emitChange();
    }
  }

  triggerBotDiscussions() {
    this.discussionQueue = [];
    this.discussionSpoken = new Map();
    void this.runDiscussionWorker();
  }

  sendHumanChat(text) {
    const human = this.getHumanPlayer();
    if (!human || !human.isAlive || !['day_discussion', 'day_defense'].includes(this.phase) || !String(text).trim()) return;
    this.addChatMessage(human, String(text).trim().slice(0, 600));
    if (this.phase === 'day_defense') return;
    const bots = this.players.filter(p => !p.isHuman && p.isAlive);
    const respondent = this.social.chooseRespondent(text, bots);
    if (respondent) this.queueBotSpeech(respondent,'reply',text);
  }

  // Luồng xét xử: thảo luận → đề cử → biện hộ → biểu quyết Có/Không.
  setStageTimer(seconds, callback) {
    const token = ++this.stageToken;
    const session = this.sessionId;
    this.stageDeadline = Date.now() + Math.max(1, seconds) * 1000;
    this.emitChange();
    const discussion = this.phase === 'day_discussion';
    let pausedMs = 0;
    let busySince = null;
    const tick = () => {
      if (token !== this.stageToken || session !== this.sessionId || this.phase === 'game_over') return;
      const now = Date.now();
      if (discussion && this.discussionBusy && pausedMs < 70000) {
        if (busySince === null) busySince = now;
        const extension = Math.min(250, 70000 - pausedMs, Math.max(0, 22000 - (now - busySince)));
        this.stageDeadline += extension;
        pausedMs += extension;
      } else if (!this.discussionBusy) busySince = null;
      if (now >= this.stageDeadline) callback();
      else setTimeout(tick, Math.min(250, this.stageDeadline - now));
    };
    setTimeout(tick, 250);
  }

  startNomination() {
    if (this.phase !== 'day_discussion') return;
    this.phase = 'day_nomination';
    this.nominations = {};
    this.humanNominations = new Set();
    this.addChatMessage(null, 'Hết giờ thảo luận! Mỗi người có thể đề cử nhiều nghi phạm. Phiên đề cử bắt đầu.', true);
    // Bot đề cử dựa trên phán đoán; mỗi bot chỉ đề cử một người.
    this.getAlivePlayers().filter(p => !p.isHuman).forEach(p => {
      const target = this.botAI.decideVote(p);
      if (target && target !== p.id && this.getPlayer(target)?.isAlive) this.nominations[target] = (this.nominations[target] || 0) + 1;
    });
    this.setStageTimer(this.timing.nomination, () => this.finishNomination());
  }

  submitNomination(targetId) {
    if (this.phase !== 'day_nomination' || this.isHumanSpectator()) return;
    if (!this.getPlayer(targetId)?.isAlive || this.humanNominations.has(targetId)) return;
    this.humanNominations.add(targetId);
    this.nominations[targetId] = (this.nominations[targetId] || 0) + 1;
    this.emitChange();
  }

  finishNomination() {
    if (this.phase !== 'day_nomination') return;
    const entries = Object.entries(this.nominations).filter(([id]) => this.getPlayer(id)?.isAlive);
    const minimum = Math.ceil(this.getAlivePlayers().length * this.timing.threshold / 100);
    let selected = entries.filter(([,n]) => n >= minimum);
    if (!selected.length && entries.length) {
      const top = Math.max(...entries.map(([,n]) => n));
      selected = entries.filter(([,n]) => n === top);
    }
    if (!selected.length) {
      this.addChatMessage(null, 'Không có ai được đề cử. Phiên tòa kết thúc, làng chuyển sang đêm.', true);
      this.phase = 'day_execution'; this.finishDay(); return;
    }
    this.candidates = selected.sort((a,b) => b[1]-a[1]).map(([id]) => id);
    this.candidateIndex = 0;
    this.candidateResults = [];
    this.startDefense();
  }

  startDefense() {
    if (this.candidateIndex >= this.candidates.length) { this.finishTrial(); return; }
    this.phase = 'day_defense';
    const candidate = this.getPlayer(this.candidates[this.candidateIndex]);
    this.addChatMessage(null, `Mời ${candidate.name} biện hộ. Thời gian: ${this.timing.defense} giây.`, true);
    if (!candidate.isHuman) {
      void this.botSpeak(candidate, 'defense');
    }
    this.setStageTimer(this.timing.defense, () => this.startCandidateVote());
  }

  getTrialRequiredVotes(aliveCount = this.getAlivePlayers().length) {
    return this.trialVoteRule === 'majority'
      ? Math.floor(aliveCount / 2) + 1
      : Math.ceil(aliveCount * 2 / 3);
  }

  startCandidateVote() {
    if (this.phase !== 'day_defense') return;
    this.phase = 'day_voting';
    this.currentCandidateId = this.candidates[this.candidateIndex];
    this.currentVotes = {};
    this.addChatMessage(null, `Biểu quyết kín cho ${this.getPlayer(this.currentCandidateId).name}: CÓ xử tử hay KHÔNG? Cần ${this.getTrialRequiredVotes()} phiếu CÓ trên ${this.getAlivePlayers().length} người còn sống (${this.trialVoteRule === 'majority' ? 'quá bán' : '2/3'}).`, true);
    this.setStageTimer(this.timing.voting, () => this.resolveAllVotes());
  }

  // true = Có, false = Không. Người bị đề cử vẫn có quyền bỏ phiếu.
  submitHumanVote(yes) {
    if (this.phase !== 'day_voting' || this.isHumanSpectator()) return;
    this.currentVotes[this.getHumanPlayer().id] = yes === true;
    this.emitChange();
  }

  resolveAllVotes() {
    if (this.phase !== 'day_voting') return;
    const candidate = this.getPlayer(this.currentCandidateId);
    const alive = this.getAlivePlayers();
    alive.filter(p => !p.isHuman).forEach(p => {
      if (p.isFrozen) return;
      const suspicion = p.aiMemory?.suspicions?.[candidate.id] ?? 50;
      this.currentVotes[p.id] = p.id === candidate.id ? false : Math.random() * 100 < suspicion;
    });
    const yes = Object.values(this.currentVotes).filter(v => v === true).length;
    const no = Object.values(this.currentVotes).filter(v => v === false).length;
    const required = this.getTrialRequiredVotes(alive.length);
    const passed = yes >= required;
    this.candidateResults.push({id:candidate.id, yes, no, passed, ratio:yes/alive.length});
    this.addChatMessage(null, `Kết quả ${candidate.name}: ${yes} CÓ, ${no} KHÔNG, ${alive.length-yes-no} trắng. ${passed ? 'Đạt' : 'Chưa đạt'} ngưỡng ${required} phiếu CÓ.`, true);
    this.candidateIndex++;
    this.startDefense();
  }

  finishTrial() {
    const passed = this.candidateResults.filter(x => x.passed).sort((a,b) => b.ratio-a.ratio);
    this.phase = 'day_execution';
    if (passed.length && (passed.length === 1 || passed[0].ratio > passed[1].ratio)) {
      this.executePlayer(this.getPlayer(passed[0].id));
    } else {
      this.addChatMessage(null, 'Không có phán quyết duy nhất đạt yêu cầu. Hôm nay không ai bị xử tử.', true);
      this.finishDay();
    }
  }

  // Tương thích với nút cũ: chuyển sang đề cử, không xử tử trực tiếp.
  startVoting() { this.startNomination(); }

  // Treo cổ người chơi bị chọn
  executePlayer(player) {
    this.phase = 'day_execution';

    // 1. Kiểm tra Kẻ Ngốc / Chán Đời (FOOL_TANNER): THẮNG NGAY LẬP TỨC!
    if (player.role === 'FOOL_TANNER') {
      player.isAlive = false;
      this.winner = 'fool';
      this.winReason = `Kẻ Ngốc [${player.name}] đã khôn khéo thao túng tâm lý dân làng để bị treo cổ thành công! Kẻ Ngốc giành chiến thắng độc tôn!`;
      this.addLog('win', this.winReason, '👑🤡');
      this.addChatMessage(null, `TIẾNG CƯỜI HOANG DẠI! ${this.winReason}`, true);
      this.phase = 'game_over';
      this.emitChange();
      return;
    }

    player.isAlive = false;
    this.addLog('death', `[${player.name}] đã bị dân làng xử tử.`, '🪢');
    this.addChatMessage(null, `Sau hồi chuông phán quyết định mệnh, [${player.name}] đã bị hành quyết! Danh phận vẫn được giữ kín.`, true);

    // 2. Nếu là Sói Con (Wolf Cub) bị treo cổ -> Đàn Sói nổi giận cắn 2 mạng
    if (player.role === 'WOLF_CUB') {
      this.wolfExtraKills = 1;
      this.addLog('night', `Sói Con đã bị giết! Nỗi căm phẫn sục sôi sẽ khiến bầy Sói được cắn thêm một nạn nhân vào đêm tới!`, '🐾🐺');
    }

    // 3. Nếu là Già Làng (Elder) bị treo oan -> Dân làng mất hết kỹ năng
    if (player.role === 'ELDER') {
      this.elderLostSkills = true;
      this.addLog('night', `Dân làng đã treo cổ Già Làng tôn kính! Lời nguyền trừng phạt khiến toàn bộ phe Dân Làng mất sạch kỹ năng đặc biệt!`, '⚡');
    }

    // 4. Nếu là Cặp Tình Nhân chết theo
    if (player.lovedOneId) {
      const lover = this.getPlayer(player.lovedOneId);
      if (lover && lover.isAlive) {
        lover.isAlive = false;
        this.addLog('death', `Đau đớn trước cái chết của người thương, [${lover.name}] đã qua đời!`, '💔');
      }
    }

    // 5. Nếu là Thợ Săn bị treo cổ -> Bắn trả
    if (player.role === 'HUNTER' && !this.elderLostSkills) {
      this.triggerHunterRevenge(player);
      return;
    }

    this.finishDay();
  }

  // Kết thúc ngày và kiểm tra điều kiện thắng
  finishDay() {
    if (this.checkWinCondition()) return;

    // Đếm ngược chuyển sang đêm kế tiếp
    const session = this.sessionId;
    setTimeout(() => {
      if (session === this.sessionId && this.phase !== 'game_over') this.startNight();
    }, 2000);
  }

  // ==========================================
  // KIỂM TRA ĐIỀU KIỆN THẮNG (WIN CONDITIONS)
  // ==========================================
  checkWinCondition() {
    const alive = this.getAlivePlayers();
    const aliveWolves = alive.filter(p => p.team === 'werewolf');
    const aliveVillagers = alive.filter(p => p.team === 'villager');
    const aliveNeutrals = alive.filter(p => p.team === 'neutral');

    // 1. Kiểm tra Cặp Tình Nhân khác phe thắng cuộc
    const lovers = alive.filter(p => p.lovedOneId);
    if (alive.length === 2 && lovers.length === 2 && lovers[0].lovedOneId === lovers[1].id) {
      if (lovers[0].team !== lovers[1].team) {
        this.winner = 'lovers';
        this.winReason = `Tình yêu vượt qua ranh giới thù hận! Cặp Tình Nhân [${lovers[0].name}] và [${lovers[1].name}] là những người cuối cùng sống sót và chiến thắng!`;
        this.endGame();
        return true;
      }
    }

    // 2. Kiểm tra Giáo Chủ (Cult Leader) thắng: Tất cả người sống đều là tín đồ
    const cultLeader = alive.find(p => p.role === 'CULT_LEADER');
    if (cultLeader && alive.every(p => p.isCultMember || p.id === cultLeader.id)) {
      this.winner = 'cult';
      this.winReason = `Toàn bộ ngôi làng đã quy phục Giáo Chủ [${cultLeader.name}]! Giáo Phái Tối Thượng thống trị trần gian!`;
      this.endGame();
      return true;
    }

    // 3. Kiểm tra Sát Nhân Hàng Loạt (Serial Killer) thắng
    if (alive.length === 1 && alive[0].role === 'SERIAL_KILLER') {
      this.winner = 'serial_killer';
      this.winReason = `Sát Nhân Hàng Loạt [${alive[0].name}] đã thảm sát sạch sẽ ngôi làng và trở thành kẻ sống sót duy nhất!`;
      this.endGame();
      return true;
    }

    // 4. Kiểm tra Sói Trắng (White Werewolf) thắng solo
    if (alive.length === 1 && alive[0].role === 'WHITE_WEREWOLF') {
      this.winner = 'white_wolf';
      this.winReason = `Sói Trắng [${alive[0].name}] đã tiêu diệt cả dân làng lẫn đàn sói đồng loại để thống trị đỉnh cao!`;
      this.endGame();
      return true;
    }

    // 5. Phe Sói thắng: Số lượng Sói >= Số lượng Dân và không còn thế lực độc lập nguy hại
    if (aliveWolves.length > 0 && aliveWolves.length >= aliveVillagers.length && aliveNeutrals.length === 0) {
      this.winner = 'werewolves';
      this.winReason = `Đàn Sói đã hoàn toàn áp đảo ngôi làng! Bóng tối vĩnh hằng bao trùm lên những kẻ xấu số!`;
      this.endGame();
      return true;
    }

    // 6. Phe Dân Làng thắng: Toàn bộ Sói và Sát Nhân đã bị tiêu diệt
    const hostiles = alive.filter(p => p.team === 'werewolf' || p.role === 'SERIAL_KILLER');
    if (hostiles.length === 0) {
      this.winner = 'villagers';
      this.winReason = `Toàn bộ hiểm họa bóng tối đã bị thanh trừng! Ánh sáng công lý và hòa bình đã trở lại với Dân Làng!`;
      this.endGame();
      return true;
    }

    // Không còn ai sống sót
    if (alive.length === 0) {
      this.winner = 'draw';
      this.winReason = `Tất cả mọi người đều đã ngã xuống! Một kết cục bi tráng hoang tàn cho cả ngôi làng.`;
      this.endGame();
      return true;
    }

    return false;
  }

  endGame() {
    this.phase = 'game_over';
    this.addLog('win', this.winReason, '🏆');
    this.addChatMessage(null, `TRÒ CHƠI KẾT THÚC! ${this.winReason}`, true);
    this.emitChange();
  }

  findActionByRole(roleId) {
    for (const [key, val] of Object.entries(this.currentNightActions)) {
      if (key.startsWith(roleId)) {
        return val;
      }
    }
    return null;
  }
}
