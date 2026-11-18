<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import type { MenuItem } from '#/api/auth.api';
  import { MenuApi, type MenuSaveParam } from '#/api/system/menu.api';
  import { $t } from '#/locales';

  defineOptions({ name: 'SystemMenu' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const tree = ref<MenuItem[]>([]);
  const query = reactive({ name: '', status: undefined as number | undefined, clientCode: 'admin' });

  const canCreate = computed(() => hasAccessByCodes(['system:menu:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:menu:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:menu:delete']));

  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<MenuSaveParam>({
    parentId: 0,
    type: 2,
    sort: 0,
    status: 0,
    visible: true,
    keepAlive: true,
    alwaysShow: false,
    clientCode: 'admin',
  });

  // antdv-next 的表格列必须走 columns 数组 + #bodyCell 插槽，
  // a-table-column 的子节点会被当成"分组表头"，不会再作为单元格渲染
  const columns = computed(() => [
    { key: 'name', title: $t('system.menu.col.name'), dataIndex: 'name' },
    { key: 'icon', title: $t('system.menu.col.icon'), width: 150 },
    { key: 'type', title: $t('system.menu.col.type'), width: 80 },
    { key: 'path', title: $t('system.menu.col.path'), width: 150 },
    { key: 'component', title: $t('system.menu.col.component'), width: 180 },
    { key: 'permission', title: $t('system.menu.col.permission'), width: 180 },
    { key: 'status', title: $t('system.menu.col.status'), width: 90 },
    { key: 'action', title: $t('system.menu.col.action'), width: 180, fixed: 'right' },
  ]);

  const statusOptions = computed(() => [
    { label: $t('common.status.enable'), value: 0 },
    { label: $t('common.status.disable'), value: 1 },
  ]);

  const typeOptions = computed(() => [
    { label: $t('system.menu.typeOption.dir'), value: 1 },
    { label: $t('system.menu.typeOption.menu'), value: 2 },
    { label: $t('system.menu.typeOption.button'), value: 3 },
  ]);

  async function load() {
    loading.value = true;
    try {
      const { data } = await MenuApi.list({
        clientCode: query.clientCode,
        name: query.name || undefined,
        status: query.status,
      });
      tree.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    query.name = '';
    query.status = undefined;
    load();
  }

  function openCreate(parent?: MenuItem) {
    editing.value = false;
    Object.assign(form, {
      id: undefined,
      parentId: parent?.id ?? 0,
      name: '',
      permission: '',
      type: parent ? 2 : 1,
      sort: 0,
      path: '',
      component: '',
      componentName: '',
      icon: '',
      status: 0,
      visible: true,
      keepAlive: true,
      alwaysShow: false,
      clientCode: query.clientCode,
      remark: '',
    });
    modalOpen.value = true;
  }

  function openEdit(row: MenuItem) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      parentId: row.parentId ?? 0,
      name: row.name,
      i18nKey: row.i18nKey ?? '',
      permission: row.permission ?? '',
      type: row.type,
      sort: row.sort ?? 0,
      path: row.path ?? '',
      component: row.component ?? '',
      componentName: row.componentName ?? '',
      redirect: row.redirect ?? '',
      icon: row.icon ?? '',
      status: row.status ?? 0,
      visible: row.visible !== false,
      keepAlive: row.keepAlive !== false,
      alwaysShow: row.alwaysShow === true,
      badge: row.badge ?? '',
      link: row.link ?? '',
      remark: row.remark ?? '',
      clientCode: row.clientCode ?? query.clientCode,
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.name) {
      message.warning($t('system.menu.msg.nameRequired'));
      return;
    }
    if (form.type !== 3 && !form.path) {
      message.warning($t('system.menu.msg.pathRequired'));
      return;
    }
    if (form.type === 2 && !form.component) {
      message.warning($t('system.menu.msg.componentRequired'));
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await MenuApi.update({ ...form });
        message.success($t('common.msg.updated'));
      } else {
        await MenuApi.create({ ...form });
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

  function remove(row: MenuItem) {
    Modal.confirm({
      content: $t('system.menu.msg.deleteConfirm', { name: row.name }),
      onOk: async () => {
        await MenuApi.delete(row.id);
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
    <a-card :bordered="false">
      <a-form layout="inline" :model="query" class="query">
        <a-form-item :label="$t('system.menu.col.name')">
          <a-input v-model:value="query.name" allow-clear :placeholder="$t('common.placeholder.fuzzy')" />
        </a-form-item>
        <a-form-item :label="$t('system.menu.col.status')">
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
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate()">{{ $t('system.menu.create') }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="tree"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="middle"
        default-expand-all-rows
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'icon'">{{ record.icon || '—' }}</template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="record.type === 1 ? 'blue' : record.type === 2 ? 'green' : 'default'">
              {{
                record.type === 1
                  ? $t('system.menu.typeOption.dir')
                  : record.type === 2
                    ? $t('system.menu.typeOption.menu')
                    : $t('system.menu.typeOption.button')
              }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'path'">{{ record.path || '—' }}</template>
          <template v-else-if="column.key === 'component'">{{ record.component || '—' }}</template>
          <template v-else-if="column.key === 'permission'">{{ record.permission || '—' }}</template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">
              {{ record.status === 0 ? $t('common.status.enable') : $t('common.status.disable') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">{{ $t('common.action.edit') }}</a>
              <a v-if="canCreate" @click="openCreate(record)">{{ $t('system.menu.createChild') }}</a>
              <a v-if="canDelete" class="danger" @click="remove(record)">{{ $t('common.action.delete') }}</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? $t('system.menu.edit') : $t('system.menu.create')"
      destroy-on-close
      width="720px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-row :gutter="8">
          <a-col :span="12">
            <a-form-item :label="$t('system.menu.form.name')" required>
              <a-input v-model:value="form.name" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.type !== 3" :span="12">
            <a-form-item :label="$t('system.menu.form.i18nKey')">
              <a-input v-model:value="form.i18nKey" :placeholder="$t('system.menu.form.i18nKeyPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.menu.form.type')" required>
              <a-select v-model:value="form.type" :options="typeOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.menu.form.parentId')">
              <a-input-number v-model:value="form.parentId" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.menu.form.sort')">
              <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.type !== 3" :span="12">
            <a-form-item :label="$t('system.menu.form.path')">
              <a-input v-model:value="form.path" :placeholder="$t('system.menu.form.pathPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.type === 2" :span="12">
            <a-form-item :label="$t('system.menu.form.component')">
              <a-input v-model:value="form.component" :placeholder="$t('system.menu.form.componentPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.type === 2" :span="12">
            <a-form-item :label="$t('system.menu.form.componentName')">
              <a-input v-model:value="form.componentName" :placeholder="$t('system.menu.form.componentNamePlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col v-if="form.type !== 1" :span="12">
            <a-form-item :label="$t('system.menu.form.permission')">
              <a-input v-model:value="form.permission" :placeholder="$t('system.menu.form.permissionPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.menu.form.icon')">
              <a-input v-model:value="form.icon" :placeholder="$t('system.menu.form.iconPlaceholder')" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.menu.form.status')">
              <a-select v-model:value="form.status" :options="statusOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.menu.form.visible')">
              <a-switch v-model:checked="form.visible" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('system.menu.form.keepAlive')">
              <a-switch v-model:checked="form.keepAlive" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="$t('system.menu.form.remark')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-textarea v-model:value="form.remark" :rows="2" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
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

  .danger {
    color: hsl(var(--destructive));
  }
</style>
