import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Team, TeamSchema } from './schemas/team.schema';
import { Enterprise, EnterpriseSchema } from './schemas/enterprise.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Team.name, schema: TeamSchema },
      { name: Enterprise.name, schema: EnterpriseSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class OrgModule {}
