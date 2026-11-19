<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';

  import { useAccess } from '@vben/access';

  import { message, Modal } from 'antdv-next';

  import { DeptApi, type Dept, type DeptSaveParam } from '#/api/system/dept.api';
  import { $t } from '#/locales';

  defineOptions({ name: 'SystemDept' });

  const { hasAccessByCodes } = useAccess();

  const loading = ref(false);
  const tree = ref<Dept[]>([]);
  const query = reactive({ name: '', status: undefined as number | undefined });

  const canCreate = computed(() => hasAccessByCodes(['system:dept:create']));
  const canUpdate = computed(() => hasAccessByCodes(['system:dept:update']));
  const canDelete = computed(() => hasAccessByCodes(['system:dept:delete']));

  const modalOpen = ref(false);
  const submitting = ref(false);
  const editing = ref(false);
  const form = reactive<DeptSaveParam>({ parentId: 0, sort: 0, status: 0 });

  // antdv-next 的表格列必须走 columns 数组 + #bodyCell 插槽，
  // a-table-column 的子节点会被当成"分组表头"，不会再作为单元格渲染
  const columns = computed(() => [
    { key: 'name', title: $t('system.dept.col.name'), dataIndex: 'name' },
    { key: 'sort', title: $t('system.dept.col.sort'), dataIndex: 'sort', width: 80 },
    { key: 'leaderUserId', title: $t('system.dept.col.leaderUserId'), width: 110 },
    { key: 'phone', title: $t('system.dept.col.phone'), width: 140 },
    { key: 'status', title: $t('system.dept.col.status'), width: 90 },
    { key: 'action', title: $t('system.dept.col.action'), width: 170, fixed: 'right' },
  ]);

  const statusOptions = computed(() => [
    { label: $t('common.status.enable'), value: 0 },
    { label: $t('common.status.disable'), value: 1 },
  ]);

  // 上级部门下拉（把树拍平成带层级前缀的列表）
  const parentOptions = ref<{ label: string; value: number }[]>([]);

  /** 顶级部门选项（文案跟随语言） */
  const parentSelectOptions = computed(() => [
    { label: $t('system.dept.form.topLevel'), value: 0 },
    ...parentOptions.value,
  ]);

  function flatten(nodes: Dept[] = [], prefix = ''): { label: string; value: number }[] {
    return nodes.flatMap((node) => [
      { label: `${prefix}${node.name}`, value: node.id },
      ...flatten(node.children ?? [], `${prefix}${node.name} / `),
    ]);
  }

  async function load() {
    loading.value = true;
    try {
      const [{ data: list }, { data: simple }] = await Promise.all([
        DeptApi.list({ name: query.name || undefined, status: query.status }),
        DeptApi.simpleList(),
      ]);
      tree.value = list ?? [];
      parentOptions.value = flatten(simple ?? []);
    } finally {
      loading.value = false;
    }
  }

  function resetQuery() {
    query.name = '';
    query.status = undefined;
    load();
  }

  function openCreate(parent?: Dept) {
    editing.value = false;
    Object.assign(form, {
      id: undefined,
      parentId: parent?.id ?? 0,
      name: '',
      sort: 0,
      leaderUserId: null,
      phone: '',
      email: '',
      status: 0,
    });
    modalOpen.value = true;
  }

  function openEdit(row: Dept) {
    editing.value = true;
    Object.assign(form, {
      id: row.id,
      parentId: row.parentId ?? 0,
      name: row.name,
      sort: row.sort ?? 0,
      leaderUserId: row.leaderUserId ?? null,
      phone: row.phone ?? '',
      email: row.email ?? '',
      status: row.status ?? 0,
    });
    modalOpen.value = true;
  }

  async function submit() {
    if (!form.name) {
      message.warning($t('system.dept.msg.nameRequired'));
      return;
    }
    submitting.value = true;
    try {
      if (editing.value) {
        await DeptApi.update({ ...form });
        message.success($t('common.msg.updated'));
      } else {
        await DeptApi.create({ ...form });
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

  function remove(row: Dept) {
    Modal.confirm({
      content: $t('system.dept.msg.deleteConfirm', { name: row.name }),
      onOk: async () => {
        await DeptApi.delete(row.id);
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
        <a-form-item :label="$t('system.dept.col.name')">
          <a-input v-model:value="query.name" allow-clear :placeholder="$t('common.placeholder.fuzzy')" />
        </a-form-item>
        <a-form-item :label="$t('system.dept.col.status')">
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
            <a-button v-if="canCreate" type="primary" ghost @click="openCreate()">{{ $t('system.dept.create') }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="tree"
        :loading="loading"
        :pagination="false"
        default-expand-all-rows
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'leaderUserId'">{{ record.leaderUserId ?? '—' }}</template>
          <template v-else-if="column.key === 'phone'">{{ record.phone || '—' }}</template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 0 ? 'green' : 'red'">
              {{ record.status === 0 ? $t('common.status.enable') : $t('common.status.disable') }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a v-if="canUpdate" @click="openEdit(record)">{{ $t('common.action.edit') }}</a>
              <a v-if="canCreate" @click="openCreate(record)">{{ $t('system.dept.createChild') }}</a>
              <a v-if="canDelete" class="danger" @click="remove(record)">{{ $t('common.action.delete') }}</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="editing ? $t('system.dept.edit') : $t('system.dept.create')"
      destroy-on-hidden
      width="560px"
      @ok="submit"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item :label="$t('system.dept.form.parentId')">
          <a-select
            v-model:value="form.parentId"
            :options="parentSelectOptions"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <a-form-item :label="$t('system.dept.form.name')" required>
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item :label="$t('system.dept.form.sort')">
          <a-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="$t('system.dept.form.leaderUserId')">
          <a-input-number v-model:value="form.leaderUserId" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="$t('system.dept.form.phone')">
          <a-input v-model:value="form.phone" />
        </a-form-item>
        <a-form-item :label="$t('system.dept.form.email')">
          <a-input v-model:value="form.email" />
        </a-form-item>
        <a-form-item :label="$t('system.dept.form.status')">
          <a-select v-model:value="form.status" :options="statusOptions" />
        </a-form-item>
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
