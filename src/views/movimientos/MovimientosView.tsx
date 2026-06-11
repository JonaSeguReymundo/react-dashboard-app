import { useEffect, useState } from 'react';
import { Table, Button, Form, Input, Select, Space, message, Tabs, Card, Divider } from 'antd';
import { movimientosService, cuentasService, transferenciasService, categoriasService } from '../../services/api/FinanzasService';

export default function FinanzasView() {
  const [loading, setLoading] = useState(false);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [form] = Form.useForm();
  const [cuentaForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movRes, cueRes, catRes] = await Promise.all([
        movimientosService.findAll(),
        cuentasService.findAll(),
        categoriasService.findAll()
      ]);
      setMovimientos(movRes?.content || movRes || []);
      setCuentas(Array.isArray(cueRes) ? cueRes : []);
      setCategorias(Array.isArray(catRes) ? catRes : []);
    } catch (error) {
      message.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onFinishTransferencia = async (values: any) => {
    try {
      await transferenciasService.create({
        payload: {
          cuentaOrigenId: Number(values.cuentaOrigenId),
          cuentaDestinoId: Number(values.cuentaDestinoId),
          monto: Number(values.monto),
          categoriaId: Number(values.categoriaId)
        }
      });
      message.success('Transferencia exitosa');
      form.resetFields();
      fetchData(); 
    } catch (error) { message.error('Error al realizar transferencia'); }
  };

  const onFinishCuenta = async (values: any) => {
    try {
      await cuentasService.create({
        payload: {
          alias: values.alias,
          moneda: values.moneda,
          tipo: values.tipo,
          saldoBase: Number(values.saldoBase)
        }
      });
      message.success('Cuenta creada');
      cuentaForm.resetFields();
      fetchData(); 
    } catch (error) { message.error('Error al crear cuenta'); }
  };

  const items = [
    { key: 'movimientos', label: 'Movimientos', children: <Table loading={loading} dataSource={movimientos} rowKey="id" columns={[{ title: 'Fecha', dataIndex: 'fecha', render: (f:any) => f ? `${f[2]}/${f[1]}/${f[0]}` : '-' }, { title: 'Descripción', dataIndex: 'descripcion' }, { title: 'Monto', dataIndex: 'monto' }]} /> },
    { key: 'cuentas', label: 'Cuentas', children: (
      <Space direction="vertical" style={{ width: '100%' }}>
<Card title="Crear nueva cuenta" style={{ marginBottom: '24px' }}>
  <Form form={cuentaForm} layout="inline" onFinish={onFinishCuenta}>
    <Form.Item name="alias" rules={[{ required: true }]}>
      <Input placeholder="Alias: Jonatan" />
    </Form.Item>
    <Form.Item name="moneda" rules={[{ required: true }]}>
      <Input placeholder="Moneda: USD" />
    </Form.Item>
    <Form.Item name="tipo" rules={[{ required: true }]}>
      <Input placeholder="Tipo: Ahorro" />
    </Form.Item>
    <Form.Item name="saldoBase" rules={[{ required: true }]}>
      <Input type="number" placeholder="Saldo: 1000" />
    </Form.Item>
    
    {/* Aquí aplicamos el espaciado */}
    <Form.Item>
      <Button type="primary" htmlType="submit" style={{ marginLeft: '10px' }}>
        Agregar
      </Button>
    </Form.Item>
  </Form>
</Card>
        <Table dataSource={cuentas} rowKey="id" columns={[{ title: 'Alias', dataIndex: 'alias' }, { title: 'Tipo', dataIndex: 'tipo' }, { title: 'Moneda', dataIndex: 'moneda' }, { title: 'Saldo', dataIndex: 'saldoBase' }]} />
      </Space>
    )},
    { key: 'transferencias', label: 'Nueva Transferencia', children: (
      <Card title="Realizar Transferencia" style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={onFinishTransferencia}>
          <Form.Item name="cuentaOrigenId" label="Origen" rules={[{ required: true }]}>
            <Select>{cuentas.map(c => <Select.Option key={c.id} value={c.id}>{c.alias || `ID: ${c.id}`}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="cuentaDestinoId" label="Destino" rules={[{ required: true }]}>
            <Select>{cuentas.map(c => <Select.Option key={c.id} value={c.id}>{c.alias || `ID: ${c.id}`}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="monto" label="Monto" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item name="categoriaId" label="Categoría" rules={[{ required: true }]}>
            <Select>{categorias.map(cat => <Select.Option key={cat.id} value={cat.id}>{cat.nombre}</Select.Option>)}</Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Transferir</Button>
        </Form>
      </Card>
    )},
    { key: 'categorias', label: 'Categorías', children: <Table dataSource={categorias} rowKey="id" columns={[{ title: 'Nombre', dataIndex: 'nombre' }, { title: 'Tipo', dataIndex: 'tipo' }]} /> }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Tabs defaultActiveKey="cuentas" items={items} />
    </div>
  );
}