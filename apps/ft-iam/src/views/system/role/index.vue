<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import type { MenuItem } from '#/api/auth.api';
  import { MenuApi } from '#/api/system/menu.api';
  import { MicroAppApi } from '#/api/system/micro-app.api';
  import { RoleApi, type Role, type RoleSaveParam } from '#/api/system/role.api';
  import { $t } from '#/locales';

  defineOptions({ name: 'SystemRole' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const list = ref<Role[]>([]);
  const total = ref(0);
  const query = reactive({
    pageNo: 1,
    pageSize: 10,
    name: '',
    code: '',
    status: undefined as number | undefined,
  });

  const canCreate = computed(() => hasAccessByCodes(['system:role:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:role:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:role:delete']));
  const canAssign = computed(() => hasAccessByCodes(['system:role:assign-menu']));

  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<RoleSaveParam>({ status: 0, dataScope: 1, sort: 0, type: 2, clientCode: 'admin' });

  // antdv-next 的表格列必须走 columns 数组 + #bodyCell 插槽，
  // a-table-column 的子节点会被当成"分组表头"，不会再作为单元格渲染
  const columns = computed(() => [
    { key: 'name', title: $t('system.role.col.name'), dataIndex: 'name' },
    { key: 'code', title: $t('system.role.col.code'), dataIndex: 'code', width: 160 },
    { key: 'sort', title: $t('system.role.col.sort'), dataIndex: 'sort', width: 80 },
    { key: 'dataScope', title: $t('system.role.col.dataScope'), width: 130 },
    { key: 'type', title: $t('system.role.col.type'), width: 90 },
    { key: 'status', title: $t('system.role.col.status'), width: 90 },
    { key: 'action', title: $t('system.role.col.action'), width: 230, fixed: 'right' },
  ]);

  const statusOptions = computed(() => [
    { label: $t('common.status.enable'), value: 0 },
    { label: $t('common.status.disable'), value: 1 },
  ]);

  const clientCodeOptions = computed(() => [
    { label: 'admin', value: 'admin' },
    { label: 'merchant', value: 'merchant' },
    { label: 'app', value: 'app' },
  ]);

  // 菜单授权：先列微应用，展开某个应用时再异步拉该应用的菜单树
  const assignOpen = ref(false);
  const assignTarget = ref<null | Role>(null);
  /** 树根节点 = 微应用；children 为空表示还没加载 */
  const appTree = ref<any[]>([]);
  /** 已经拉过菜单的应用 appKey */
  const loadedApps = ref<Set<string>>(new Set());
  /**
   * 勾选状态的真源：保存所有已勾选的 key（含还没加载出来的菜单）。
   *
   * a-tree 是受控检查模式，只认树里存在的 key，把整个 id 列表塞进去会被过滤掉，
   * 所以这里自己维护，只把「当前已加载出来的那部分」交给树渲染。
   */
  const selectedKeys = ref<Set<string>>(new Set());
  /** 已经从后端加载过的节点 key（菜单 id 的字符串形式） */
  const loadedNodeKeys = ref<Set<string>>(new Set());
  /** 展开的节点 key（自己维护，不用 a-tree 的 load-data） */
  const expandedKeys = ref<string[]>([]);
  /** 交给 a-tree 的勾选 key：已加载节点 ∩ 已勾选 */
  const checkedKeys = computed(() => {
    const result: string[] = [];
    for (const key of selectedKeys.value) {
      if (loadedNodeKeys.value.has(key)) result.push(key);
    }
    return result;
  });

  const dataScopeOptions = computed(() => [
    { label: $t('system.role.dataScopeOption.all'), value: 1 },
    { label: $t('system.role.dataScopeOption.deptAndChild'), value: 2 },
    { label: $t('system.role.dataScopeOption.dept'), value: 3 },
    { label: $t('system.role.dataScopeOption.self'), value: 4 },
    { label: $t('system.role.dataScopeOption.custom'), value: 5 },
  ]);

  async function load() {
    loading.value = true;
    try {
      const { data } = await RoleApi.page({
        pageNo: query.pageNo,
        pageSize: query.pageSize,
        name: query.name || undefined,
        code: query.code || undefined,
        status: query.status,
      });
      list.value = data?.list ?? [];
      total.value = data?.total ?? 0;
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    query.name = '';
    query.code = '';
    query.status = undefined;
    query.pageNo = 1;
    load();
  }

  function openCreate() {
    editing.value = false;
    Object.assign(form, {
      id: undefined,
      name: '',
      code: '',
      sort: 0,
      dataScope: 1,
      dataScopeDeptIds: [],
      status: 0,
      type: 2,
      remark: '',
      clientCode: 'admin',
      menuIds: [],
    });
    modalOpen.value = true;
  }

  function openEdit(row: Role) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      name: row.name,
      code: row.code,
      sort: row.sort ?? 0,
      dataScope: row.dataScope ?? 1,
      dataScopeDeptIds: row.dataScopeDeptIds ?? [],
      status: row.status ?? 0,
      type: row.type ?? 2,
      remark: row.remark,
      clientCode: row.clientCode ?? 'admin',
      menuIds: row.menuIds ?? [],
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.name || !form.code) {
      message.warning($t('system.role.msg.nameRequired'));
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await RoleApi.update({ ...form });
        message.success($t('common.msg.updated'));
      } else {
        await RoleApi.create({ ...form });
        message.success($t('common.msg.created'));
      }
      modalOpen.value = false;
      await load();
    } catch (error: any) {
      message.error(error?.response?.data?.msg || $t('common.msg.saveFailed'));
    } finally {
      submitting.value = false;
    }
  }

  async function toggleStatus(row: Role) {
    await RoleApi.updateStatus(row.id, row.status === 0 ? 1 : 0);
    message.success($t('system.role.msg.statusUpdated'));
    await load();
  }

  function menuTitle(item: MenuItem) {
    return (item.i18nKey && $t(item.i18nKey)) || item.name || String(item.id);
  }

  function toTreeNode(item: MenuItem): any {
    const children = (item.children ?? []).map((child) => toTreeNode(child));
    return {
      key: String(item.id),
      title: menuTitle(item),
      /** 1 目录 / 2 菜单 / 3 按钮，树里用标签展示 */
      menuType: item.type,
      isLeaf: children.length === 0,
      children: children.length > 0 ? children : undefined,
    };
  }

  /** 收集一棵树里所有节点的 key（写进已加载集合） */
  function collectNodeKeys(nodes: any[], out: Set<string>) {
    for (const node of nodes ?? []) {
      if (node.key && !String(node.key).startsWith('app:')) out.add(String(node.key));
      if (node.children) collectNodeKeys(node.children, out);
    }
  }

  /** 按单个应用拉菜单树（懒加载）：整体替换根节点，保证 a-tree 重新渲染 */
  async function loadAppMenus(appKey: string) {
    if (loadedApps.value.has(appKey)) return;
    const { data } = await MenuApi.list({ appKey });
    const nodes = (data ?? []).map((item) => toTreeNode(item));
    const keys = new Set<string>();
    collectNodeKeys(nodes, keys);
    loadedNodeKeys.value = new Set([...loadedNodeKeys.value, ...keys]);
    loadedApps.value = new Set([...loadedApps.value, appKey]);
    appTree.value = appTree.value.map((item) =>
      item.appKey === appKey
        ? { ...item, isLeaf: nodes.length === 0, children: nodes }
        : item,
    );
  }

  /**
   * 节点展开时才请求该应用菜单。
   *
   * 不用 a-tree 的 load-data：它会把加载结果自己再注册进内部树，
   * 我们又更新了 treeData，同一批节点被注册两遍，控制台刷
   * "Same 'key' exist in the Tree"。这里改成 @expand 驱动，数据只有一份。
   */
  async function onExpand(keys: any[], info: any) {
    expandedKeys.value = (keys ?? []).map((key: any) => String(key));
    const node = info?.node?.dataRef ?? info?.node;
    const appKey = node?.appKey as string | undefined;
    if (appKey && !loadedApps.value.has(appKey)) {
      await loadAppMenus(appKey);
    }
  }

  /** 树的勾选变化：只覆盖「已加载节点」那部分，未展开应用的授权保持原样 */
  function onCheck(keys: any[]) {
    const known = loadedNodeKeys.value;
    const kept = [...selectedKeys.value].filter((key) => !known.has(key));
    const nowChecked = keys
      .map((key) => String(key))
      .filter((key) => !key.startsWith('app:') && known.has(key));
    selectedKeys.value = new Set([...kept, ...nowChecked]);
  }

  async function openAssign(row: Role) {
    assignTarget.value = row;
    // 只发两个轻请求：微应用清单 + 角色已授权菜单 id，弹窗先出来
    const [{ data: apps }, { data: detail }] = await Promise.all([
      MicroAppApi.list(),
      RoleApi.get(row.id),
    ]);
    selectedKeys.value = new Set((detail?.menuIds ?? []).map((id) => String(id)));
    loadedNodeKeys.value = new Set();
    loadedApps.value = new Set();
    expandedKeys.value = [];
    appTree.value = (apps ?? []).map((app) => ({
      key: `app:${app.key}`,
      title: app.title,
      appKey: app.key,
      kind: 'app',
      isLeaf: false,
    }));
    assignOpen.value = true;
  }

  /** 提交前把所有应用都加载完，避免未展开应用的授权被覆盖丢失 */
  async function loadAllApps() {
    const pending = appTree.value.filter((root) => !loadedApps.value.has(root.appKey));
    await Promise.all(pending.map((root) => loadAppMenus(root.appKey)));
  }

  async function submitAssign() {
    if (!assignTarget.value) return;
    submitting.value = true;
    try {
      await loadAllApps();
      const menuIds = new Set<number>();
      for (const key of selectedKeys.value) {
        if (key.startsWith('app:')) {
          // 勾了应用根节点 = 该应用整棵树的菜单全选
          const appKey = key.slice(4);
          const root = appTree.value.find((item) => item.appKey === appKey);
          const keys = new Set<string>();
          collectNodeKeys(root?.children ?? [], keys);
          for (const child of keys) menuIds.add(Number(child));
          continue;
        }
        const id = Number(key);
        if (Number.isInteger(id)) menuIds.add(id);
      }
      // 只提交叶子级勾选：后端按 menuIds 覆盖角色菜单关联
      await RoleApi.assignMenu(assignTarget.value.id, [...menuIds]);
      message.success($t('system.role.msg.assignSaved'));
      assignOpen.value = false;
      await load();
    } finally {
      submitting.value = false;
    }
  }

  function remove(row: Role) {
    Modal.confirm({
      content: $t('system.role.msg.deleteConfirm', { name: row.name }),
      onOk: async () => {
        await RoleApi.delete(row.id);
        message.success($t('common.msg.deleted'));
        await load();
      },
      title: $t('common.msg.deleteConfirmTitle'),
    });
  }

  onMounted(load);
</script>

<template>
  <div class="page">
    <a-card variant="borderless">
      <a-form layout="inline" :model="query" class="query">
        <a-form-item :label="$t('system.role.col.name')">
          <a-input v-model:value="query.name" allow-clear :placeholder="$t('common.placeholder.fuzzy')" />
        </a-form-item>
        <a-form-item :label="$t('system.role.col.code')">
          <a-input v-model:value="query.code" allow-clear placeholder="common" />
        </a-form-item>
        <a-form-item :label="$t('system.role.col.status')">
          <a-select
            v-model:value="query.status"
            allow-clear
            :placeholder="$t('common.placeholder.all')"
            style="width: 110px"
            :options="statusOptions"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="load">{{ $t('common.action.query') }}</a-button>
            <a-button @click="resetQuery">{{ $t('common.action.reset') }}</a-button>
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate">{{ $t('system.role.create') }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="{
          current: query.pageNo,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => $t('common.total', { total: t }),
        }"
        row-key="id"
        size="middle"
        @change="(pag: any) => { query.pageNo = pag.current; query.pageSize = pag.pageSize; load(); }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'dataScope'">
            {{ dataScopeOptions.find((d) => d.value === record.dataScope)?.label || '—' }}
          </template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="record.internal ? 'blue' : 'default'">
              {{ record.internal ? $t('system.role.internal') : $t('system.role.custom') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">
              {{ record.status === 0 ? $t('common.status.enable') : $t('common.status.disable') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">{{ $t('common.action.edit') }}</a>
              <a v-if="canAssign" @click="openAssign(record)">{{ $t('system.role.assignMenu') }}</a>
              <a v-if="canUpdate" @click="toggleStatus(record)">
                {{ record.status === 0 ? $t('common.status.disable') : $t('common.status.enable') }}
              </a>
              <a v-if="canDelete" class="danger" @click="remove(record)">{{ $t('common.action.delete') }}</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? $t('system.role.edit') : $t('system.role.create')"
      destroy-on-hidden
      width="620px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="$t('system.role.form.name')" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item :label="$t('system.role.form.code')" required>
          <a-input v-model:value="form.code" :disabled="editing" :placeholder="$t('system.role.form.codePlaceholder')" />
        </a-form-item>
        <a-form-item :label="$t('system.role.form.sort')">
          <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="$t('system.role.form.dataScope')">
          <a-select v-model:value="form.dataScope" :options="dataScopeOptions" />
        </a-form-item>
        <a-form-item :label="$t('system.role.form.status')">
          <a-select v-model:value="form.status" :options="statusOptions" />
        </a-form-item>
        <a-form-item :label="$t('system.role.form.clientCode')">
          <a-select v-model:value="form.clientCode" :options="clientCodeOptions" />
        </a-form-item>
        <a-form-item :label="$t('system.role.form.remark')">
          <a-textarea v-model:value="form.remark" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="assignOpen"
      :title="$t('system.role.assignTitle')"
      width="560px"
      destroy-on-hidden
      @ok="submitAssign"
    >
      <p v-if="assignTarget">
        {{ $t('system.role.assignTarget', { name: assignTarget.name, code: assignTarget.code }) }}
      </p>
      <div class="tree-box">
        <a-tree
          :checked-keys="checkedKeys"
          :expanded-keys="expandedKeys"
          :tree-data="appTree"
          checkable
          :field-names="{ children: 'children', key: 'key', title: 'title' }"
          @check="onCheck"
          @expand="onExpand"
        >
          <template #titleRender="node">
            <span class="tree-node-title">{{ node.title }}</span>
            <a-tag v-if="node.kind === 'app'" class="tree-node-type" color="purple">
              {{ $t('system.role.appTag') }}
            </a-tag>
            <a-tag
              v-else-if="node.menuType"
              class="tree-node-type"
              :color="node.menuType === 1 ? 'blue' : node.menuType === 2 ? 'green' : 'default'"
            >
              {{
                node.menuType === 1
                  ? $t('system.role.menuTypeOption.dir')
                  : node.menuType === 2
                    ? $t('system.role.menuTypeOption.menu')
                    : $t('system.role.menuTypeOption.button')
              }}
            </a-tag>
          </template>
        </a-tree>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
  .page {
    padding: 16px;
  }

  .query {
    margin-bottom: 12px;
  }

  .tree-node-title {
    margin-right: 6px;
  }

  .tree-node-type {
    margin-inline-end: 0;
    font-size: 11px;
    line-height: 16px;
  }

  .tree-box {
    max-height: 420px;
    padding: 8px;
    overflow: auto;
    border: 1px solid hsl(var(--border));
    border-radius: 6px;
  }

  .danger {
    color: hsl(var(--destructive));
  }
</style>
