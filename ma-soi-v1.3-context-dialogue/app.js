// app.js - Controller điều khiển UI, tương tác người chơi và kết nối Game Engine

import { ROLES, ROLE_LIST, GAME_PRESETS } from './roles.js';
import { WerewolfEngine } from './engine.js';
import { sounds } from './sound.js';

class WerewolfApp {
  constructor() {
    this.engine = new WerewolfEngine();
    this.godMode = false;
    this.selectedPresetId = 'preset_beginner';
    this.customRoleCounts = {}; // { ROLE_ID: count }
    this.selectedTargetId = null;
    this.selectedSecondaryTargetId = null;
    this.activeCodexTab = 'all';
    this.voiceEnabled = true;
    this.lastNarrationId = null;
    this.chatRenderedCount = 0;
    this.chatUnread = 0;

    // Khởi tạo số lượng vai mặc định theo Preset đầu tiên
    this.applyPreset(this.selectedPresetId);

    this.initDOM();
    this.bindEvents();
    this.renderCodex();
    this.installTrainingPanel();
    this.installChatReadingControls();

    // Lắng nghe cập nhật từ Game Engine
    this.engine.subscribe((eng) => this.handleEngineUpdate(eng));
    setInterval(() => this.updateStageClock(), 250);
  }

  installChatReadingControls() {
    const list = this.dom.messagesList;
    const notice = document.getElementById('newMessagesNotice');
    const pause = document.getElementById('toggleDebatePause');
    const pace = document.getElementById('speechPace');
    if (pace) pace.addEventListener('change', () => { this.engine.speechPaceMs = ({slow:12000,normal:8000,fast:4000})[pace.value] || 12000; });
    if (pause) pause.addEventListener('click', () => {
      this.engine.debatePaused = !this.engine.debatePaused;
      pause.textContent = this.engine.debatePaused ? '▶ Tiếp tục bot' : '⏸ Tạm dừng bot';
    });
    if (notice) notice.addEventListener('click', () => { list.scrollTop = list.scrollHeight; this.chatUnread = 0; notice.hidden = true; });
    if (list) list.addEventListener('scroll', () => {
      if (list.scrollHeight - list.scrollTop - list.clientHeight < 55) {this.chatUnread = 0; if(notice)notice.hidden=true;}
    }, {passive:true});
  }

  installTrainingPanel() {
    const parent = this.dom.setupView;
    if (!parent) return;
    const panel = document.createElement('section');
    panel.className = 'offline-training-panel';
    panel.innerHTML = `<h3>🧠 Huấn luyện chiến thuật bot — Offline</h3>
      <p>Huấn luyện mô phỏng quyết định (không dùng API, không phải huấn luyện mô hình ngôn ngữ).</p>
      <label>Số lượt mô phỏng: <select id="offlineRounds"><option value="1000">1.000</option><option value="5000" selected>5.000</option><option value="20000">20.000</option></select></label>
      <button id="offlineTrain" type="button">Huấn luyện ngay</button>
      <button id="offlineReset" type="button">Xóa kinh nghiệm</button>
      <p id="offlineStats" aria-live="polite"></p>`;
    panel.insertAdjacentHTML('beforeend', `<hr><h3>🐺 Self-play — Ván Ma Sói hoàn chỉnh (6 vai cơ bản)</h3>
      <p>Chạy <code>train_selfplay.bat</code> khi game đã đóng, rồi tải lại trang. Bộ huấn luyện mới lấy mẫu đủ 36 vai, nhưng kỹ năng còn mô phỏng theo nhóm (chưa đúng toàn bộ luật riêng).</p>
      <p id="selfplayStatus">Đang kiểm tra trọng số self-play…</p>`);
    parent.appendChild(panel);
    fetch('./selfplay-policy.json?version=12',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(p=>{
      const e=panel.querySelector('#selfplayStatus');
      e.textContent=p?.version===2?`Đã nạp ${p.games.toLocaleString('vi-VN')} ván mô phỏng (${p.players} người). Đánh giá ${p.evaluation.matches} ván: Sói thắng ${Math.round(p.evaluation.trainedWolfWinRate*100)}%. Đây không phải tỷ lệ thắng trước người thật.`:'Chưa có dữ liệu self-play; bot vẫn dùng chiến thuật mặc định.';
    }).catch(()=>{});
    const stats=panel.querySelector('#offlineStats');
    const refresh=()=>{const p=this.engine.offline.profile;stats.textContent=`Đã mô phỏng: ${p.trained.toLocaleString('vi-VN')} lượt. ${p.benchmark?`Điểm thưởng đại diện: ${p.benchmark.meanReward} (không phải tỷ lệ thắng).`:''}`;};
    panel.querySelector('#offlineTrain').addEventListener('click',()=>{
      const n=Number(panel.querySelector('#offlineRounds').value);
      this.engine.offline.train(n);refresh();
    });
    panel.querySelector('#offlineReset').addEventListener('click',()=>{
      try{localStorage.removeItem('masoi_offline_policy_v1');}catch{}
      this.engine.offline.profile=this.engine.offline.load();refresh();
    });
    refresh();
  }

  // Lấy các DOM element
  initDOM() {
    this.dom = {
      // Views
      setupView: document.getElementById('setupView'),
      gameplayView: document.getElementById('gameplayView'),

      // Header buttons
      btnToggleSound: document.getElementById('btnToggleSound'),
      soundIcon: document.getElementById('soundIcon'),
      btnToggleGodMode: document.getElementById('btnToggleGodMode'),
      btnOpenCodex: document.getElementById('btnOpenCodex'),
      btnNewGame: document.getElementById('btnNewGame'),

      // Setup View elements
      presetsGrid: document.getElementById('presetsGrid'),
      customRolesList: document.getElementById('customRolesList'),
      humanNameInput: document.getElementById('humanNameInput'),
      humanRoleSelect: document.getElementById('humanRoleSelect'),
      summaryTotalPlayers: document.getElementById('summaryTotalPlayers'),
      summaryWolfCount: document.getElementById('summaryWolfCount'),
      summaryVillagerCount: document.getElementById('summaryVillagerCount'),
      summaryNeutralCount: document.getElementById('summaryNeutralCount'),
      btnStartGame: document.getElementById('btnStartGame'),

      // Gameplay View elements
      phaseIcon: document.getElementById('phaseIcon'),
      phaseText: document.getElementById('phaseText'),
      aliveCountText: document.getElementById('aliveCountText'),
      stageClock: document.getElementById('stageClock'),
      playersCircle: document.getElementById('playersCircle'),
      actionDock: document.getElementById('actionDock'),
      actionPromptText: document.getElementById('actionPromptText'),
      actionInstruction: document.getElementById('actionInstruction'),
      actionButtonsRow: document.getElementById('actionButtonsRow'),
      messagesList: document.getElementById('messagesList'),
      chatForm: document.getElementById('chatForm'),
      chatInput: document.getElementById('chatInput'),
      chronicleList: document.getElementById('chronicleList'),
      chronicleDayTag: document.getElementById('chronicleDayTag'),

      // Codex Modal
      codexModal: document.getElementById('codexModal'),
      btnCloseCodex: document.getElementById('btnCloseCodex'),
      codexSearchInput: document.getElementById('codexSearchInput'),
      codexBody: document.getElementById('codexBody'),

      // Game Over Modal
      gameOverModal: document.getElementById('gameOverModal'),
      winnerIcon: document.getElementById('winnerIcon'),
      winnerTitle: document.getElementById('winnerTitle'),
      winnerReason: document.getElementById('winnerReason'),
      gameoverRevealList: document.getElementById('gameoverRevealList'),
      btnPlayAgain: document.getElementById('btnPlayAgain'),
      btnBackToLobby: document.getElementById('btnBackToLobby')
    };

    this.renderPresets();
    this.renderCustomRoleSelector('all');
    this.updateSetupSummary();
  }

  // Gán sự kiện người dùng
  bindEvents() {
    // Âm thanh
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'btn-header';
    voiceBtn.textContent = '🎙️ Quản trò: Bật';
    voiceBtn.onclick = () => {
      this.voiceEnabled = !this.voiceEnabled;
      voiceBtn.textContent = this.voiceEnabled ? '🎙️ Quản trò: Bật' : '🔇 Quản trò: Tắt';
      if (!this.voiceEnabled && 'speechSynthesis' in window) speechSynthesis.cancel();
    };
    this.dom.btnToggleSound.parentElement.appendChild(voiceBtn);
    this.dom.btnToggleSound.addEventListener('click', () => {
      const isMuted = sounds.toggleMute();
      this.dom.soundIcon.textContent = isMuted ? '🔇' : '🔊';
      sounds.playClick();
    });

    // Chế độ Soi (God View)
    this.dom.btnToggleGodMode.addEventListener('click', () => {
      this.godMode = !this.godMode;
      this.dom.btnToggleGodMode.classList.toggle('active', this.godMode);
      sounds.playClick();
      if (this.engine.phase !== 'setup') {
        this.renderPlayersCircle();
      }
    });

    // Mở Bách Khoa Thư 36 Vai
    this.dom.btnOpenCodex.addEventListener('click', () => {
      this.dom.codexModal.style.display = 'flex';
      sounds.playClick();
    });

    this.dom.btnCloseCodex.addEventListener('click', () => {
      this.dom.codexModal.style.display = 'none';
      sounds.playClick();
    });

    // Tìm kiếm trong Codex
    this.dom.codexSearchInput.addEventListener('input', (e) => {
      this.renderCodex(e.target.value, this.activeCodexTab);
    });

    // Lọc phe trong Codex
    document.querySelectorAll('.codex-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.codex-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCodexTab = btn.getAttribute('data-team');
        this.renderCodex(this.dom.codexSearchInput.value, this.activeCodexTab);
        sounds.playClick();
      });
    });

    // Tab lọc trong Custom Setup
    document.querySelectorAll('.role-tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.role-tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderCustomRoleSelector(btn.getAttribute('data-tab'));
        sounds.playClick();
      });
    });

    // Nút Bắt đầu Game
    this.dom.btnStartGame.addEventListener('click', () => {
      this.startGame();
    });

    // Nút Về Phòng Mới / Đổi Kịch Bản
    this.dom.btnNewGame.addEventListener('click', () => {
      this.backToLobby();
    });
    this.dom.btnBackToLobby.addEventListener('click', () => {
      this.dom.gameOverModal.style.display = 'none';
      this.backToLobby();
    });

    this.dom.btnPlayAgain.addEventListener('click', () => {
      this.dom.gameOverModal.style.display = 'none';
      this.startGame();
    });

    // Form Chat Ban Ngày
    this.dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = this.dom.chatInput.value.trim();
      if (val) {
        this.engine.sendHumanChat(val);
        this.dom.chatInput.value = '';
        sounds.playClick();
      }
    });
  }

  // ==========================================
  // RENDER CÁC PRESETS & SETUP
  // ==========================================
  renderPresets() {
    this.dom.presetsGrid.innerHTML = '';
    GAME_PRESETS.forEach(preset => {
      const card = document.createElement('div');
      card.className = `preset-card ${preset.id === this.selectedPresetId ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="preset-name">${preset.name}</div>
        <div class="preset-meta">${preset.playerCount} Người Chơi</div>
        <div class="preset-desc">${preset.description}</div>
      `;
      card.addEventListener('click', () => {
        this.applyPreset(preset.id);
        this.renderPresets();
        this.renderCustomRoleSelector('all');
        this.updateSetupSummary();
        sounds.playClick();
      });
      this.dom.presetsGrid.appendChild(card);
    });
  }

  applyPreset(presetId) {
    this.selectedPresetId = presetId;
    const preset = GAME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    this.customRoleCounts = {};
    ROLE_LIST.forEach(r => this.customRoleCounts[r.id] = 0);
    preset.roles.forEach(roleKey => {
      this.customRoleCounts[roleKey] = (this.customRoleCounts[roleKey] || 0) + 1;
    });
  }

  renderCustomRoleSelector(tab = 'all') {
    this.dom.customRolesList.innerHTML = '';
    const filteredRoles = ROLE_LIST.filter(r => {
      if (tab === 'all') return true;
      return r.team === tab;
    });

    filteredRoles.forEach(role => {
      const count = this.customRoleCounts[role.id] || 0;
      const item = document.createElement('div');
      item.className = 'custom-role-item';
      item.innerHTML = `
        <div class="role-item-info">
          <span class="role-item-icon">${role.icon}</span>
          <div>
            <div class="role-item-name" style="color: ${role.color}">${role.name}</div>
            <div class="role-item-team" style="color: var(--text-muted)">${role.badge} (${role.enName})</div>
          </div>
        </div>
        <div class="role-counter-controls">
          <button class="btn-counter btn-minus" data-id="${role.id}">-</button>
          <span class="role-count-display">${count}</span>
          <button class="btn-counter btn-plus" data-id="${role.id}">+</button>
        </div>
      `;

      item.querySelector('.btn-minus').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.customRoleCounts[role.id] > 0) {
          this.customRoleCounts[role.id]--;
          this.selectedPresetId = null;
          this.renderPresets();
          this.renderCustomRoleSelector(tab);
          this.updateSetupSummary();
          sounds.playClick();
        }
      });

      item.querySelector('.btn-plus').addEventListener('click', (e) => {
        e.stopPropagation();
        this.customRoleCounts[role.id] = (this.customRoleCounts[role.id] || 0) + 1;
        this.selectedPresetId = null;
        this.renderPresets();
        this.renderCustomRoleSelector(tab);
        this.updateSetupSummary();
        sounds.playClick();
      });

      this.dom.customRolesList.appendChild(item);
    });
  }

  updateSetupSummary() {
    let total = 0;
    let wolfCount = 0;
    let villagerCount = 0;
    let neutralCount = 0;

    const availableRolesInGame = [];

    for (const [roleId, count] of Object.entries(this.customRoleCounts)) {
      if (count > 0) {
        total += count;
        const role = ROLES[roleId];
        if (role) {
          if (role.team === 'werewolf') wolfCount += count;
          else if (role.team === 'villager') villagerCount += count;
          else if (role.team === 'neutral') neutralCount += count;

          availableRolesInGame.push({ id: role.id, name: role.name, icon: role.icon });
        }
      }
    }

    this.dom.summaryTotalPlayers.textContent = total;
    this.dom.summaryWolfCount.textContent = wolfCount;
    this.dom.summaryVillagerCount.textContent = villagerCount;
    this.dom.summaryNeutralCount.textContent = neutralCount;

    // Cập nhật select vai của người chơi
    const prevSelected = this.dom.humanRoleSelect.value;
    this.dom.humanRoleSelect.innerHTML = `<option value="RANDOM">🎲 Ngẫu Nhiên (Bất ngờ)</option>`;
    availableRolesInGame.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.icon} ${r.name}`;
      if (r.id === prevSelected) opt.selected = true;
      this.dom.humanRoleSelect.appendChild(opt);
    });
  }

  // ==========================================
  // BẮT ĐẦU VÁN CHƠI
  // ==========================================
  startGame() {
    for (const key of ['discussion','nomination','defense','voting','threshold']) {
      const input=document.getElementById('timing_'+key);
      if (input) this.engine.timing[key]=Math.max(key==='threshold'?1:5, Math.min(key==='threshold'?100:3600,Number(input.value)||this.engine.timing[key]));
    }

    const voteRule = document.getElementById('trial_vote_rule')?.value;
    this.engine.trialVoteRule = voteRule === 'majority' ? 'majority' : 'supermajority';

    const selectedRoles = [];
    for (const [roleId, count] of Object.entries(this.customRoleCounts)) {
      for (let i = 0; i < count; i++) {
        selectedRoles.push(roleId);
      }
    }

    if (selectedRoles.length < 5) {
      alert('Vui lòng chọn tối thiểu 5 người chơi để bắt đầu ván Ma Sói!');
      return;
    }

    const humanName = this.dom.humanNameInput.value.trim() || 'Bạn';
    const chosenRoleOpt = this.dom.humanRoleSelect.value;
    const humanRole = chosenRoleOpt === 'RANDOM' ? null : chosenRoleOpt;

    this.dom.setupView.style.display = 'none';
    this.dom.gameplayView.style.display = 'grid';
    this.dom.btnNewGame.style.display = 'flex';

    sounds.playWolfHowl();
    this.engine.setupGame(selectedRoles, humanRole, humanName);
  }

  backToLobby() {
    this.dom.gameplayView.style.display = 'none';
    this.dom.setupView.style.display = 'grid';
    this.dom.btnNewGame.style.display = 'none';
    this.renderPresets();
    this.renderCustomRoleSelector('all');
    this.updateSetupSummary();
    sounds.playClick();
  }

  // Chat nhanh
  sendQuickChat(text) {
    if (['day_discussion', 'day_defense'].includes(this.engine.phase)) {
      this.engine.sendHumanChat(text);
      sounds.playClick();
    }
  }

  // ==========================================
  // XỬ LÝ CẬP NHẬT TỪ ENGINE (REACTION TO STATE)
  // ==========================================
  handleEngineUpdate(engine) {
    this.updatePhaseIndicator(engine);
    this.renderPlayersCircle();
    this.renderActionDock();
    this.renderChatMessages();
    this.renderChronicle();
    this.updateStageClock();
    this.narrateModerator();

    if (engine.phase === 'game_over') {
      this.showGameOverModal();
    }
  }

  narrateModerator() {
    const messages = this.engine.chatMessages;
    const msg = messages[messages.length - 1];
    if (!msg || !msg.isSystem || msg.id === this.lastNarrationId) return;
    this.lastNarrationId = msg.id;
    if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg.text);
      utterance.lang = 'vi-VN'; utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (err) { console.warn('Không thể đọc lời quản trò:', err); }
  }

  updatePhaseIndicator(engine) {
    const alive = engine.getAlivePlayers();
    this.dom.aliveCountText.textContent = `${alive.length}/${engine.players.length} người còn sống`;
    this.dom.chronicleDayTag.textContent = `Ngày ${engine.dayNumber}`;

    if (engine.phase === 'night') {
      this.dom.phaseIcon.textContent = '🌙';
      this.dom.phaseText.textContent = `Đêm Thứ ${engine.dayNumber} - Ngôi Làng Ngủ Say`;
    } else if (engine.phase === 'day_discussion') {
      this.dom.phaseIcon.textContent = '☀️';
      this.dom.phaseText.textContent = `Ngày Thứ ${engine.dayNumber} - Thảo Luận & Biện Luận`;
    } else if (engine.phase === 'day_nomination') {
      this.dom.phaseIcon.textContent = '📣'; this.dom.phaseText.textContent = `Ngày ${engine.dayNumber} - Đề cử`;
    } else if (engine.phase === 'day_defense') {
      this.dom.phaseIcon.textContent = '⚖️'; this.dom.phaseText.textContent = `Ngày ${engine.dayNumber} - Biện hộ`;
    } else if (engine.phase === 'day_voting') {
      this.dom.phaseIcon.textContent = '🗳️';
      this.dom.phaseText.textContent = `Ngày Thứ ${engine.dayNumber} - Biểu Quyết Treo Cổ`;
    } else if (engine.phase === 'hunter_revenge') {
      this.dom.phaseIcon.textContent = '🏹';
      this.dom.phaseText.textContent = `Phát Bắn Báo Thù Của Thợ Săn!`;
    } else if (engine.phase === 'game_over') {
      this.dom.phaseIcon.textContent = '🏆';
      this.dom.phaseText.textContent = `Trận Đấu Kết Thúc`;
    }
  }

  // ==========================================
  // RENDER VÒNG TRÒN LÀNG QUANH LỬA TRẠI
  // ==========================================
  renderPlayersCircle() {
    this.dom.playersCircle.innerHTML = '';
    const human = this.engine.getHumanPlayer();

    this.engine.players.forEach(p => {
      const isDead = !p.isAlive;
      const isHuman = p.isHuman;
      const isSelected = this.selectedTargetId === p.id || this.selectedSecondaryTargetId === p.id;

      // Xác định hiển thị vai: Người chơi luôn thấy vai mình; thấy vai bot nếu bật GodMode hoặc khi bot chết
      const showRole = isHuman || this.godMode || (human && human.team === 'werewolf' && p.team === 'werewolf' && p.isAlive);

      const card = document.createElement('div');
      card.className = `player-seat-card ${isDead ? 'dead' : ''} ${isHuman ? 'human-player' : ''} ${isSelected ? 'selected-target' : ''}`;
      card.setAttribute('data-player-id', p.id);

      // Trạng thái đặc biệt
      let badgesHtml = '';
      if (p.isFrozen) badgesHtml += `<span class="status-badge" title="Bị Đóng Băng">❄️</span>`;
      if (p.isNightmared) badgesHtml += `<span class="status-badge" title="Rơi vào Ác Mộng">🌑</span>`;
      if (p.isInfected) badgesHtml += `<span class="status-badge" title="Nhiễm Dịch Bệnh">☣️</span>`;
      if (p.lovedOneId) badgesHtml += `<span class="status-badge" title="Cặp Tình Nhân">💖</span>`;
      if (p.isCultMember) badgesHtml += `<span class="status-badge" title="Tín Đồ Giáo Phái">🛐</span>`;

      card.innerHTML = `
        <div class="seat-avatar">
          ${isDead ? '🪦' : p.avatar}
          <div class="status-badge-cluster">${badgesHtml}</div>
        </div>
        <div class="seat-name">${isHuman ? `⭐ ${p.name} (Bạn)` : p.name}</div>
        <div class="seat-role-badge" style="${showRole ? `color: ${p.roleData.color}; border: 1px solid ${p.roleData.color}` : ''}">
          ${showRole ? `${p.roleData.icon} ${p.roleData.name}` : '❓ Ẩn Danh'}
        </div>
        ${(this.engine.phase === 'day_voting' && p.votesCount > 0) ? `<div class="seat-votes-badge">${p.votesCount} phiếu</div>` : ''}
      `;

      // Click vào người chơi để chọn làm mục tiêu hành động
      card.addEventListener('click', () => {
        if (!isDead && this.canSelectPlayer(p)) {
          this.handlePlayerCardClick(p);
        }
      });

      this.dom.playersCircle.appendChild(card);
    });
  }

  // Kiểm tra xem người chơi có thể click chọn người này hay không
  canSelectPlayer(targetPlayer) {
    const human = this.engine.getHumanPlayer();
    if (!human) return false;
    if (this.engine.phase === 'hunter_revenge' && this.engine.pendingHunter?.id === human.id) return targetPlayer.isAlive;
    if (!human.isAlive) return false;

    // Lúc bỏ phiếu ban ngày
    if (this.engine.phase === 'day_nomination') {
      return targetPlayer.isAlive && !this.engine.humanNominations?.has(targetPlayer.id);
    }
    if (this.engine.phase === 'day_voting') {
      return false;
    }

    // Lúc Thợ Săn bắn trả
    if (this.engine.phase === 'hunter_revenge' && this.engine.pendingHunter?.id === human.id) {
      return targetPlayer.isAlive;
    }

    // Lúc Đêm
    if (this.engine.phase === 'night' && human.roleData.hasNightAction) {
      // Không tự chọn chính mình trừ vai có thể tự chọn
      if (targetPlayer.id === human.id && human.role !== 'BODYGUARD' && human.role !== 'DOCTOR' && human.role !== 'ILLUSION_WOLF') {
        return false;
      }
      return targetPlayer.isAlive;
    }

    return false;
  }

  handlePlayerCardClick(player) {
    const human = this.engine.getHumanPlayer();

    // Nếu vai cần chọn 2 người (Cupid, Detective)
    if (human && this.engine.phase === 'night' && (human.role === 'CUPID' || human.role === 'DETECTIVE')) {
      if (!this.selectedTargetId) {
        this.selectedTargetId = player.id;
      } else if (this.selectedTargetId === player.id) {
        this.selectedTargetId = null;
      } else if (!this.selectedSecondaryTargetId) {
        this.selectedSecondaryTargetId = player.id;
      } else {
        this.selectedSecondaryTargetId = player.id;
      }
    } else {
      // Chọn 1 người
      this.selectedTargetId = (this.selectedTargetId === player.id) ? null : player.id;
    }

    sounds.playClick();
    this.renderPlayersCircle();
    this.renderActionDock();
  }

  // ==========================================
  // RENDER BẢNG THAO TÁC CỦA NGƯỜI CHƠI (ACTION DOCK)
  // ==========================================
  renderActionDock() {
    const human = this.engine.getHumanPlayer();
    this.dom.actionButtonsRow.innerHTML = '';

    // Nếu người chơi đã chết
    if (!human || !human.isAlive) {
      if (this.engine.phase === 'hunter_revenge' && this.engine.pendingHunter?.id === human.id) {
        // Thợ săn hấp hối được bắn 1 phát cuối
        this.dom.actionInstruction.textContent = `Bạn đã trúng đòn tử thương! Hãy chọn 1 người để kéo theo xuống mồ!`;
        const target = this.engine.getPlayer(this.selectedTargetId);
        if (target) {
          const btnShoot = document.createElement('button');
          btnShoot.className = 'btn-action-primary btn-action-wolf';
          btnShoot.innerHTML = `🏹 Bắn Hạ [${target.name}]`;
          btnShoot.onclick = () => {
            sounds.playGunshot();
            this.engine.executeHunterShot(this.selectedTargetId);
            this.selectedTargetId = null;
          };
          this.dom.actionButtonsRow.appendChild(btnShoot);
        }
        return;
      }

      this.dom.actionInstruction.textContent = 'Bạn đã ngã xuống! Bạn đang theo dõi trận đấu ở chế độ Khán Giả.';
      return;
    }

    // ==================
    // 1. BAN ĐÊM (NIGHT)
    // ==================
    if (this.engine.phase === 'night') {
      // Kiểm tra có bị Ác Mộng / Đóng Băng không
      if (human.isNightmared || human.isFrozen) {
        this.dom.actionInstruction.textContent = `Bạn đang bị ${human.isFrozen ? 'Đóng Băng' : 'Ác Mộng'} làm tê liệt, không thể dùng kỹ năng đêm nay.`;
        const btnWait = document.createElement('button');
        btnWait.className = 'btn-action-secondary';
        btnWait.textContent = '💤 Nhắm Mắt Đi Ngủ';
        btnWait.onclick = () => {
          this.engine.resolveNight();
        };
        this.dom.actionButtonsRow.appendChild(btnWait);
        return;
      }

      // 1.1. Phe Sói Cắn
      if (human.team === 'werewolf') {
        const target = this.engine.getPlayer(this.selectedTargetId);
        this.dom.actionInstruction.textContent = `Bạn là [${human.roleData.name}]! Hãy chọn một con mồi trong làng để cắn chết:`;

        if (target) {
          const btnKill = document.createElement('button');
          btnKill.className = 'btn-action-primary btn-action-wolf';
          btnKill.innerHTML = `🐺 Cắn [${target.name}]`;
          btnKill.onclick = () => {
            sounds.playWolfHowl();
            this.engine.submitHumanNightAction('WOLF_KILL', target.id);
            this.selectedTargetId = null;
          };
          this.dom.actionButtonsRow.appendChild(btnKill);

          // Nếu là Sói Chúa có quyền Nhiễm Hóa
          if (human.role === 'ALPHA_WOLF' && !human.specialAbilityUsed) {
            const btnInfect = document.createElement('button');
            btnInfect.className = 'btn-action-primary';
            btnInfect.innerHTML = `👑 Nhiễm Hóa [${target.name}] Thành Sói (1 Lần)`;
            btnInfect.onclick = () => {
              this.engine.submitHumanNightAction('ALPHA_WOLF_INFECT', target.id);
              this.selectedTargetId = null;
            };
            this.dom.actionButtonsRow.appendChild(btnInfect);
          }
        }
        return;
      }

      // 1.2. Tiên Tri Soi
      if (human.role === 'SEER' || (human.role === 'APPRENTICE_SEER' && human.isSeerAwakened)) {
        const target = this.engine.getPlayer(this.selectedTargetId);
        this.dom.actionInstruction.textContent = `Chọn 1 người để nhìn thấu phe phái qua quả cầu Tiên Tri:`;
        if (target) {
          const btnSeer = document.createElement('button');
          btnSeer.className = 'btn-action-primary';
          btnSeer.innerHTML = `🔮 Soi Danh Phận [${target.name}]`;
          btnSeer.onclick = () => {
            sounds.playMagicPotion();
            this.engine.submitHumanNightAction('SEER', target.id);
            this.selectedTargetId = null;
          };
          this.dom.actionButtonsRow.appendChild(btnSeer);
        }
        return;
      }

      // 1.3. Bảo Vệ
      if (human.role === 'BODYGUARD') {
        const target = this.engine.getPlayer(this.selectedTargetId);
        this.dom.actionInstruction.textContent = `Chọn 1 người để canh gác đêm nay (không lặp lại người đêm trước):`;
        if (target && target.id !== human.lastProtectedId) {
          const btnProt = document.createElement('button');
          btnProt.className = 'btn-action-primary';
          btnProt.innerHTML = `🛡️ Bảo Vệ [${target.name}]`;
          btnProt.onclick = () => {
            this.engine.submitHumanNightAction('BODYGUARD', target.id);
            this.selectedTargetId = null;
          };
          this.dom.actionButtonsRow.appendChild(btnProt);
        }
        return;
      }

      // 1.4. Phù Thủy (Witch)
      if (human.role === 'WITCH') {
        const wolfVictim = this.engine.getPlayer(this.engine.nightContext?.wolfVictimId);
        this.dom.actionInstruction.textContent = 'Phù Thủy thức dậy. Chọn một người để cứu (không biết ai bị cắn), hoặc dùng bình độc; tối đa một bình mỗi đêm.';

        // Nút Cứu
        const healTarget = this.engine.getPlayer(this.selectedTargetId);
        if (healTarget && human.hasHealPotion) {
          const btnHeal = document.createElement('button');
          btnHeal.className = 'btn-action-primary';
          btnHeal.innerHTML = `🧪 Cứu [${healTarget.name}]`;
          btnHeal.onclick = () => {
            sounds.playMagicPotion();
            this.engine.submitHumanNightAction('WITCH', { healTargetId: healTarget.id });
          };
          this.dom.actionButtonsRow.appendChild(btnHeal);
        }

        // Nút Độc
        const poisonTarget = this.engine.getPlayer(this.selectedTargetId);
        if (human.hasPoisonPotion && poisonTarget) {
          const btnPoison = document.createElement('button');
          btnPoison.className = 'btn-action-primary btn-action-wolf';
          btnPoison.innerHTML = `☠️ Đầu Độc [${poisonTarget.name}]`;
          btnPoison.onclick = () => {
            sounds.playMagicPotion();
            this.engine.submitHumanNightAction('WITCH', { poisonTargetId: poisonTarget.id });
            this.selectedTargetId = null;
          };
          this.dom.actionButtonsRow.appendChild(btnPoison);
        }

        // Nút Không dùng
        const btnPass = document.createElement('button');
        btnPass.className = 'btn-action-secondary';
        btnPass.textContent = '💤 Không Dùng Bình Nào';
        btnPass.onclick = () => {
          this.engine.submitHumanNightAction('WITCH', {});
        };
        this.dom.actionButtonsRow.appendChild(btnPass);
        return;
      }

      // 1.5. Thần Tình Yêu (Cupid) Đêm 1
      if (human.role === 'CUPID' && this.engine.dayNumber === 1) {
        const p1 = this.engine.getPlayer(this.selectedTargetId);
        const p2 = this.engine.getPlayer(this.selectedSecondaryTargetId);
        this.dom.actionInstruction.textContent = `Hãy chọn 2 người bất kỳ trong làng để xe duyên thành Cặp Tình Nhân:`;

        if (p1 && p2) {
          const btnCupid = document.createElement('button');
          btnCupid.className = 'btn-action-primary';
          btnCupid.innerHTML = `💘 Ghép Đôi [${p1.name}] & [${p2.name}]`;
          btnCupid.onclick = () => {
            this.engine.submitHumanNightAction('CUPID', p1.id, p2.id);
            this.selectedTargetId = null;
            this.selectedSecondaryTargetId = null;
          };
          this.dom.actionButtonsRow.appendChild(btnCupid);
        }
        return;
      }

      // 1.6. Sát Nhân Hàng Loạt
      if (human.role === 'SERIAL_KILLER') {
        const target = this.engine.getPlayer(this.selectedTargetId);
        this.dom.actionInstruction.textContent = `Chọn 1 nạn nhân xấu số để hạ sát trong đêm:`;
        if (target) {
          const btnKill = document.createElement('button');
          btnKill.className = 'btn-action-primary btn-action-wolf';
          btnKill.innerHTML = `🔪 Sát Hại [${target.name}]`;
          btnKill.onclick = () => {
            this.engine.submitHumanNightAction('SERIAL_KILLER', target.id);
            this.selectedTargetId = null;
          };
          this.dom.actionButtonsRow.appendChild(btnKill);
        }
        return;
      }

      // 1.7. Mục Sư (Nước Thánh)
      if (human.role === 'PRIEST') {
        const target = this.engine.getPlayer(this.selectedTargetId);
        this.dom.actionInstruction.textContent = human.specialAbilityUsed
          ? `Bạn đã hết Nước Thánh. Ngôi làng đang ngủ say...`
          : `Chọn 1 người để tưới Nước Thánh (nếu là Sói/Sát Nhân sẽ bốc cháy chết):`;

        if (target && !human.specialAbilityUsed) {
          const btnHoly = document.createElement('button');
          btnHoly.className = 'btn-action-primary';
          btnHoly.innerHTML = `✝️ Tưới Nước Thánh Lên [${target.name}]`;
          btnHoly.onclick = () => {
            this.engine.submitHumanNightAction('PRIEST', target.id);
            this.selectedTargetId = null;
          };
          this.dom.actionButtonsRow.appendChild(btnHoly);
        }
      }

      // Các vai không có kỹ năng đêm hoặc đã hoàn thành
      if (!human.roleData.hasNightAction || (human.role === 'CUPID' && this.engine.dayNumber > 1)) {
        this.dom.actionInstruction.textContent = `Bạn là [${human.roleData.name}]. Đêm nay không có kỹ năng kích hoạt, hãy ngủ say chờ bình minh.`;
        const btnSleep = document.createElement('button');
        btnSleep.className = 'btn-action-secondary';
        btnSleep.textContent = '💤 Nhắm Mắt Đi Ngủ';
        btnSleep.onclick = () => {
          this.engine.resolveNight();
        };
        this.dom.actionButtonsRow.appendChild(btnSleep);
        return;
      }
    }

    // 2. BAN NGÀY: THẢO LUẬN
    if (this.engine.phase === 'day_discussion') {
      this.dom.actionInstruction.textContent = 'Cậu có thể chat, chất vấn và tranh luận. Đồng hồ vẫn chạy liên tục.';
      const btn = document.createElement('button'); btn.className='btn-action-primary';
      btn.textContent='📣 Kết thúc thảo luận, mở đề cử';
      btn.onclick=()=>this.engine.startNomination(); this.dom.actionButtonsRow.appendChild(btn); return;
    }
    if (this.engine.phase === 'day_nomination') {
      const target = this.engine.getPlayer(this.selectedTargetId);
      this.dom.actionInstruction.textContent = 'Chọn người trên bàn để đề cử. Có thể đề cử nhiều người, mỗi người một lần.';
      if (target?.isAlive && !this.engine.humanNominations?.has(target.id)) {
        const btn=document.createElement('button'); btn.className='btn-action-primary';
        btn.textContent=`📣 Đề cử ${target.name}`;
        btn.onclick=()=>{this.engine.submitNomination(target.id);this.selectedTargetId=null;};
        this.dom.actionButtonsRow.appendChild(btn);
      }
      const done=document.createElement('button');done.className='btn-action-secondary';done.textContent='Hoàn tất đề cử';
      done.onclick=()=>this.engine.finishNomination();this.dom.actionButtonsRow.appendChild(done);return;
    }
    if (this.engine.phase === 'day_defense') {
      const id=this.engine.candidates?.[this.engine.candidateIndex];
      const isMyDefense = id === human.id;
      this.dom.actionInstruction.textContent = isMyDefense
        ? '⚖️ Đến lượt cậu biện hộ! Nhập lời giải thích vào ô chat bên phải và nhấn Gửi.'
        : `⚖️ ${this.engine.getPlayer(id)?.name || 'Ứng viên'} đang biện hộ. Cậu vẫn có thể chất vấn qua ô chat.`;
      const btn=document.createElement('button');btn.className='btn-action-secondary';btn.textContent='⏭️ Chuyển sang biểu quyết';
      btn.onclick=()=>this.engine.startCandidateVote();this.dom.actionButtonsRow.appendChild(btn);return;
    }
    if (this.engine.phase === 'day_voting') {
      const name=this.engine.getPlayer(this.engine.currentCandidateId)?.name || 'ứng viên';
      const own=this.engine.currentVotes?.[human.id];
      this.dom.actionInstruction.textContent=`Biểu quyết kín cho ${name}: ${own===true?'Đã chọn CÓ':own===false?'Đã chọn KHÔNG':'Cậu chọn CÓ hay KHÔNG?'}`;
      for (const [yes,label] of [[true,'✅ CÓ — Xử tử'],[false,'❌ KHÔNG — Tha']]) {
        const btn=document.createElement('button');btn.className=yes?'btn-action-primary':'btn-action-secondary';
        btn.textContent=label;btn.onclick=()=>this.engine.submitHumanVote(yes);this.dom.actionButtonsRow.appendChild(btn);
      }
      return;
    }
  }

  updateStageClock() {
    if (!this.dom.stageClock) return;
    const active=['day_discussion','day_nomination','day_defense','day_voting'].includes(this.engine.phase);
    if (!active || !this.engine.stageDeadline) {this.dom.stageClock.textContent='';return;}
    const remaining=Math.max(0,Math.ceil((this.engine.stageDeadline-Date.now())/1000));
    this.dom.stageClock.textContent=`⏳ ${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
  }

  // ==========================================
  // RENDER CHAT VÀ NHẬT KÝ
  // ==========================================
  renderChatMessages() {
    const list = this.dom.messagesList;
    const messages = this.engine.chatMessages;
    const human = this.engine.getHumanPlayer();
    const notice = document.getElementById('newMessagesNotice');
    // Preserve the reader's position. Only follow the conversation if already at the bottom.
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 65;
    const oldTop = list.scrollTop;
    if (messages.length < this.chatRenderedCount) { list.replaceChildren(); this.chatRenderedCount = 0; this.chatUnread = 0; }
    for (let i = this.chatRenderedCount; i < messages.length; i++) {
      const msg = messages[i];
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble ' + (msg.isSystem ? 'system-msg' : human && msg.senderId === human.id ? 'human-msg' : 'bot-msg');
      const sender = document.createElement('div'); sender.className='msg-sender';
      const avatar = document.createElement('span'); avatar.textContent=msg.senderAvatar || '';
      const name = document.createElement('span'); name.textContent=msg.senderName || '';
      const time = document.createElement('span');time.textContent=msg.time || '';time.style.cssText='font-size:10px;color:var(--text-muted);margin-left:auto';
      sender.append(avatar,name,time);
      const content = document.createElement('div');content.className='msg-content';content.textContent=msg.text || '';
      bubble.append(sender,content);list.appendChild(bubble);
    }
    const added = messages.length - this.chatRenderedCount;
    this.chatRenderedCount = messages.length;
    if (nearBottom) {list.scrollTop=list.scrollHeight;this.chatUnread=0;}
    else {list.scrollTop=oldTop;this.chatUnread+=Math.max(0,added);}
    if (notice) {notice.hidden=this.chatUnread===0;notice.textContent=`↓ ${this.chatUnread} tin nhắn mới`;}
  }

  renderChronicle() {
    this.dom.chronicleList.innerHTML = '';
    this.engine.logs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'chronicle-item';
      item.innerHTML = `
        <span class="chronicle-time">[${log.time}]</span>
        <span>${log.icon} ${log.text}</span>
      `;
      this.dom.chronicleList.appendChild(item);
    });
  }

  // ==========================================
  // RENDER BÁCH KHOA THƯ 36 VAI (CODEX)
  // ==========================================
  renderCodex(searchQuery = '', filterTeam = 'all') {
    this.dom.codexBody.innerHTML = '';
    const query = searchQuery.toLowerCase().trim();

    const filtered = ROLE_LIST.filter(r => {
      const matchTeam = (filterTeam === 'all' || r.team === filterTeam);
      const matchQuery = !query || r.name.toLowerCase().includes(query) || r.enName.toLowerCase().includes(query) || r.shortDesc.toLowerCase().includes(query);
      return matchTeam && matchQuery;
    });

    filtered.forEach(role => {
      const card = document.createElement('div');
      card.className = 'codex-role-card';
      card.innerHTML = `
        <div class="codex-card-top">
          <div class="codex-card-title" style="color: ${role.color}">
            <span>${role.icon}</span>
            <span>${role.name}</span>
          </div>
          <span class="codex-badge" style="background: rgba(255,255,255,0.08); color: ${role.color}; border: 1px solid ${role.color}">
            ${role.badge}
          </span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted); font-style: italic;">${role.enName} • ${role.category}</div>
        <div class="codex-card-desc">${role.fullDesc}</div>
        <div class="codex-card-tips">💡 Mẹo: ${role.tips}</div>
      `;
      this.dom.codexBody.appendChild(card);
    });
  }

  // ==========================================
  // HIỂN THỊ KẾT THÚC VÁN ĐẤU (GAME OVER)
  // ==========================================
  showGameOverModal() {
    sounds.playVictory();
    this.dom.gameOverModal.style.display = 'flex';

    let icon = '🏆';
    let title = 'KẾT THÚC TRẬN ĐẤU';
    if (this.engine.winner === 'villagers') {
      icon = '👨‍🌾✨';
      title = 'PHE DÂN LÀNG CHIẾN THẮNG!';
    } else if (this.engine.winner === 'werewolves') {
      icon = '🐺🩸';
      title = 'PHE SÓI CHIẾN THẮNG!';
    } else if (this.engine.winner === 'fool') {
      icon = '🤡🪢';
      title = 'KẺ NGỐC ĐÃ CHIẾN THẮNG ĐỘC TÔN!';
    } else if (this.engine.winner === 'lovers') {
      icon = '💖💍';
      title = 'CẶP TÌNH NHÂN CHIẾN THẮNG!';
    } else if (this.engine.winner === 'serial_killer') {
      icon = '🔪🩸';
      title = 'SÁT NHÂN HÀNG LOẠT CHIẾN THẮNG!';
    } else if (this.engine.winner === 'cult') {
      icon = '🔮🛐';
      title = 'GIÁO PHÁI TỐI THƯỢNG THỐNG TRỊ!';
    }

    this.dom.winnerIcon.textContent = icon;
    this.dom.winnerTitle.textContent = title;
    this.dom.winnerReason.textContent = this.engine.winReason;

    // Hiển thị danh tính thật của toàn bộ làng
    this.dom.gameoverRevealList.innerHTML = '';
    this.engine.players.forEach(p => {
      const item = document.createElement('div');
      item.className = 'reveal-item';
      item.innerHTML = `
        <span>${p.avatar} <strong>${p.name}</strong> ${p.isHuman ? '(Bạn)' : ''}</span>
        <span style="color: ${p.roleData.color}; font-weight: 700;">${p.roleData.icon} ${p.roleData.name} (${p.isAlive ? 'Sống' : 'Chết'})</span>
      `;
      this.dom.gameoverRevealList.appendChild(item);
    });
  }
}

// Khởi chạy App khi tải xong DOM
window.addEventListener('DOMContentLoaded', () => {
  window.app = new WerewolfApp();
});
