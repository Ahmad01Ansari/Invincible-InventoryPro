import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Save, Building2, Users, Palette, Trash2, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

const ROLES = [
  { value: 'company_owner', label: 'Company Owner (Full Access)' },
  { value: 'super_admin', label: 'Super Admin (Full Access)' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'purchase_manager', label: 'Purchase Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'staff', label: 'General Staff' },
  { value: 'read_only', label: 'Read-Only Viewer' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'preferences'>('profile');
  const { company, setCompany, user: authUser } = useAuthStore();
  const queryClient = useQueryClient();

  // --- Company Profile State ---
  const [companyData, setCompanyData] = useState({
    name: company?.name || '',
    email: company?.email || '',
    phone: '',
    address: '',
    gstNumber: '',
  });

  const { data: fetchedCompany } = useQuery({
    queryKey: ['settings-company'],
    queryFn: () => api.get('/settings/company').then(r => r.data),
    staleTime: 0,
  });

  // Load company details when fetched
  useEffect(() => {
    if (fetchedCompany && companyData.name === company?.name && companyData.phone === '') {
      setCompanyData({
        name: fetchedCompany.name || '',
        email: fetchedCompany.email || '',
        phone: fetchedCompany.phone || '',
        address: fetchedCompany.address || '',
        gstNumber: fetchedCompany.gstNumber || '',
      });
    }
  }, [fetchedCompany, company, companyData.name, companyData.phone]);

  const updateCompanyMut = useMutation({
    mutationFn: (d: any) => api.put('/settings/company', d),
    onSuccess: (res) => {
      toast.success('Company profile updated!');
      setCompany(res.data);
      queryClient.invalidateQueries({ queryKey: ['settings-company'] });
    },
    onError: () => toast.error('Failed to update company profile'),
  });

  // --- Users State ---
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'staff' });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['settings-users'],
    queryFn: () => api.get('/settings/users').then(r => r.data),
    enabled: activeTab === 'users',
  });

  const createUserMut = useMutation({
    mutationFn: (d: any) => api.post('/settings/users', d),
    onSuccess: () => {
      toast.success('Staff member invited successfully');
      setShowAddUser(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'staff' });
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create user'),
  });

  const deleteUserMut = useMutation({
    mutationFn: (id: string) => api.delete(`/settings/users/${id}`),
    onSuccess: () => {
      toast.success('Staff member deleted');
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Deletion failed'),
  });

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyMut.mutate(companyData);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMut.mutate(newUser);
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage global configurations and staff access control.</p>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 ${
            activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4" /> Company Profile
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" /> Staff Management
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 flex items-center gap-2 ${
            activeTab === 'preferences' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="w-4 h-4" /> Preferences
        </button>
      </div>

      {activeTab === 'profile' && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Company Identity</CardTitle>
            <CardDescription>This information is publicly displayed on your invoices and reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompanySubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={companyData.name} onChange={e => setCompanyData({...companyData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" value={companyData.email} onChange={e => setCompanyData({...companyData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input type="tel" value={companyData.phone} onChange={e => setCompanyData({...companyData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>GST / Tax Registration Number</Label>
                  <Input value={companyData.gstNumber} onChange={e => setCompanyData({...companyData, gstNumber: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Headquarters Address</Label>
                  <Input value={companyData.address} onChange={e => setCompanyData({...companyData, address: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={updateCompanyMut.isPending} className="gap-2">
                  {updateCompanyMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'users' && (
         <Card className="animate-fade-in">
         <CardHeader className="flex flex-row items-center justify-between">
           <div>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>Invite team members and govern their module access via Roles.</CardDescription>
           </div>
           <Button onClick={() => setShowAddUser(true)} className="gap-2">
             <UserPlus className="w-4 h-4" /> Invite Staff
           </Button>
         </CardHeader>
         <CardContent>
           {usersLoading ? (
             <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
           ) : (
             <div className="border rounded-lg overflow-hidden">
               <table className="w-full text-sm text-left">
                 <thead className="bg-muted font-medium text-muted-foreground">
                   <tr>
                     <th className="px-4 py-3 border-b">Name</th>
                     <th className="px-4 py-3 border-b">Email Address</th>
                     <th className="px-4 py-3 border-b">Assigned Role</th>
                     <th className="px-4 py-3 border-b">Status</th>
                     <th className="px-4 py-3 border-b text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {users?.map((u: any) => (
                     <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                       <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName} {u._id === authUser?._id && '(You)'}</td>
                       <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                       <td className="px-4 py-3">
                        <span className="capitalize px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                          {u.role.replace('_', ' ')}
                        </span>
                       </td>
                       <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                       </td>
                       <td className="px-4 py-3 text-center">
                         {u.role !== 'company_owner' && u._id !== authUser?._id && (
                           <button 
                            onClick={() => { if(confirm(`Remove ${u.firstName} from the workspace?`)) deleteUserMut.mutate(u._id) }}
                            className="text-muted-foreground hover:text-destructive p-1"
                            title="Revoke Access"
                           >
                            <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </CardContent>
       </Card>
      )}

      {activeTab === 'preferences' && (
         <Card className="animate-fade-in border-dashed">
         <CardHeader>
           <CardTitle>System Preferences</CardTitle>
           <CardDescription>Personalize your local app experience.</CardDescription>
         </CardHeader>
         <CardContent className="h-40 flex items-center justify-center text-muted-foreground flex-col gap-2">
           <Palette className="w-10 h-10 opacity-20" />
           <p>Dark mode and accent colors can currently be toggled from the Topbar sun/moon icon globally across sessions!</p>
         </CardContent>
       </Card>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in py-10">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Invite Staff Member</h2>
              <button onClick={() => setShowAddUser(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <form id="user-form" onSubmit={handleAddUserSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Account Email</Label>
                  <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Temporary Password</Label>
                  <Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} minLength={6} required />
                  <p className="text-xs text-muted-foreground">They can change this upon their first login.</p>
                </div>
                <div className="space-y-2 pt-2">
                  <Label className="flex items-center">
                    Global System Role
                    <InfoTooltip text="Role permissions strictly wall off data access. Super Admins own all data. Read-Only can view lists but cannot touch POS or Inventory levels directly." />
                  </Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    {ROLES.filter(r => r.value !== 'company_owner').map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className="p-5 border-t flex justify-end gap-3 bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
              <Button type="submit" form="user-form" disabled={createUserMut.isPending}>
                {createUserMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Invite User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
